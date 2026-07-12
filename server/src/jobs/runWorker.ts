import { Worker, type Job } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { runAgentPipeline } from "../agents/graph.js";
import { runRepository } from "../repositories/run.repository.js";
import { reportRepository } from "../repositories/report.repository.js";
import { threatRepository } from "../repositories/threat.repository.js";
import { vulnerabilityRepository } from "../repositories/vulnerability.repository.js";
import { mitigationRepository } from "../repositories/mitigation.repository.js";
import { organizationRepository } from "../repositories/organization.repository.js";
import { technologyRepository } from "../repositories/technology.repository.js";
import { emitToOrg, EVENTS } from "../events/eventBus.js";
import Run from "../models/Run.js";
import redisPub from "../config/redis.js";
import logger from "../config/logger.js";
import type { RunJobData } from "./runQueue.js";
import mongoose from "mongoose";
import { reportNotificationService } from "../services/reportNotification.service.js";

async function publishProgress(runId: string, payload: unknown) {
  await redisPub.publish(`run-${runId}-progress`, JSON.stringify(payload));
}

async function executeRun(runId: string, organizationId: string) {
  const run = await Run.findById(runId);
  if (!run) throw new Error(`Run ${runId} not found`);

  if (run.status === "cancelled") {
    logger.info({ runId }, "Run was cancelled before execution started, skipping");
    return;
  }

  run.status = "running";
  await emitToOrg(organizationId, EVENTS.RUN_STARTED, { runId });
  run.startedAt = new Date();
  await run.save();
  await publishProgress(runId, { status: "running", stage: null });

  try {
    const organization = await organizationRepository.findById(organizationId);
    if (!organization) throw new Error("Organization not found");

    const technologyInventory = await technologyRepository.findByOrganization(organizationId);
    const populatedInventory = await Promise.all(
      technologyInventory.map((item) => item.populate("catalogRef"))
    );

    const result = await runAgentPipeline({
      runId,
      organizationId,
      organization: organization.toObject() as any,
      technologyInventory: populatedInventory as any,
    });

    // re-check cancellation after the (potentially long) pipeline run
    const freshRun = await Run.findById(runId);
    if (freshRun?.status === "cancelled") {
      logger.info({ runId }, "Run was cancelled during execution, discarding results");
      return;
    }

    // If ANY node in the pipeline recorded an error (threat intel, vuln research,
    // incident response, report writing, etc.), the run must not be marked
    // completed and no report should be generated — regardless of whether some
    // nodes partially succeeded. This throws into the catch block below, which
    // already handles setting status="failed", failureReason, errorCount, and
    // emitting RUN_FAILED.
    if (result.errors && result.errors.length > 0) {
      throw new Error(`Pipeline completed with errors: ${result.errors.join("; ")}`);
    }

    // The pipeline must have actually produced a report before we consider
    // this run "completed" — a null/missing report means the run did not
    // succeed, even if some findings were partially gathered.
    if (!result.report) {
      throw new Error("Pipeline finished without producing a report");
    }

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const savedThreats = await threatRepository.bulkCreate(
        result.threats.map((t: any) => ({
          ...t,
          organizationId: new mongoose.Types.ObjectId(organizationId),
          runId: new mongoose.Types.ObjectId(runId),
          publishedAt: t.publishedAt ? new Date(t.publishedAt) : undefined,
        })),
        session
      );

      const savedVulnerabilities = await vulnerabilityRepository.bulkCreate(
        result.vulnerabilities.map((v: any) => ({
          ...v,
          organizationId: new mongoose.Types.ObjectId(organizationId),
          runId: new mongoose.Types.ObjectId(runId),
          publishedAt: v.publishedAt ? new Date(v.publishedAt) : undefined,
          kevDueDate: v.kevDueDate ? new Date(v.kevDueDate) : undefined,
        })),
        session
      );

      const cveIdToVulnId = new Map(savedVulnerabilities.map((v: any) => [v.cveId, v._id]));

      const mitigationsToSave = result.mitigations
        .filter((m) => cveIdToVulnId.has(m.vulnerabilityCveId))
        .map((m) => ({
          organizationId,
          runId,
          vulnerabilityId: cveIdToVulnId.get(m.vulnerabilityCveId),
          title: m.title,
          recommendation: m.recommendation,
          actionType: m.actionType,
          priority: m.priority,
          estimatedEffort: m.estimatedEffort,
        }));

      await mitigationRepository.bulkCreate(mitigationsToSave as any, session);

      // At this point result.errors is guaranteed empty (checked above), so the
      // run is only ever marked "completed" when every node succeeded cleanly.
      run.status = "completed";
      run.completedAt = new Date();
      run.currentStage = undefined;
      await run.save({ session });

      const savedReport = await reportRepository.create(
        {
          organizationId,
          runId,
          status: "final",
          riskLevel: result.report.riskLevel,
          executiveSummary: result.report.executiveSummary,
          reportBody: result.report.reportBody,
          complianceNotes: result.report.complianceNotes,
          threatCount: savedThreats.length,
          vulnerabilityCount: savedVulnerabilities.length,
          mitigationCount: mitigationsToSave.length,
          generatedAt: new Date(),
        } as any,
        session
      );

      await session.commitTransaction();
      await emitToOrg(organizationId, EVENTS.RUN_COMPLETED, { runId });
      await emitToOrg(organizationId, EVENTS.REPORT_GENERATED, { runId, reportId: savedReport!._id.toString() });
      await reportNotificationService.sendReportToTeam(organization, savedReport!._id.toString(), {
        riskLevel: result.report.riskLevel,
        executiveSummary: result.report.executiveSummary,
        threats: result.threats,
        vulnerabilities: result.vulnerabilities as any,
        mitigations: result.mitigations,
      });
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }

    await publishProgress(runId, { status: "completed" });
  } catch (err) {
    logger.error({ err, runId }, "Run execution failed");
    run.status = "failed";
    run.failureReason = (err as Error).message;
    run.errorCount += 1;
    await emitToOrg(organizationId, EVENTS.RUN_FAILED, { runId, error: (err as Error).message });
    await run.save();
    await publishProgress(runId, { status: "failed", error: (err as Error).message });
    throw err; // let BullMQ retry policy handle it
  }
}

const runWorker = new Worker<RunJobData>(
  "runQueue",
  async (job: Job<RunJobData>) => {
    let { runId, organizationId } = job.data;

    if (job.name === "execute-scheduled-run") {
      const org = await organizationRepository.findById(organizationId);
      if (!org) throw new Error("Organization not found for scheduled run");

      const newRun = await runRepository.create({
        organizationId,
        triggeredBy: org.createdBy,
        triggerType: "scheduled",
        status: "queued",
      } as any);
      runId = newRun._id.toString();
    }

    await executeRun(runId, organizationId);
    return { runId };
  },
  {
    connection: redisConnection,
    concurrency: 3,
  }
);

runWorker.on("completed", (job) => {
  logger.info({ jobId: job.id, runId: job.returnvalue?.runId }, "Run job completed");
});

runWorker.on("failed", (job, err) => {
  logger.error({ jobId: job?.id, runId: job?.data?.runId, attemptsMade: job?.attemptsMade, err }, "Run job failed");
});

process.on("SIGTERM", async () => await runWorker.close());
process.on("SIGINT", async () => await runWorker.close());

export default runWorker;
