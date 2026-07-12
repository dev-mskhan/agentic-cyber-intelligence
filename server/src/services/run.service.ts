import { runRepository } from "../repositories/run.repository.js";
import { technologyRepository } from "../repositories/technology.repository.js";
import { subscriptionRepository } from "../repositories/subscription.repository.js";
import { enqueueRun, cancelQueuedRun } from "../jobs/runQueue.js";
import ApiError from "../utils/apiError.js";

export const runService = {
  startManualRun: async (organizationId: string, userId: string) => {
    const inventoryCount = await technologyRepository.countByOrganization(organizationId);
    if (inventoryCount === 0) {
      throw new ApiError(400, "Add at least one technology inventory entry before running an analysis");
    }

    const activeCount = await runRepository.countActiveByOrganization(organizationId);
    if (activeCount > 0) {
      throw new ApiError(409, "A run is already in progress for this organization");
    }

    const subscription = await subscriptionRepository.findByOrganization(organizationId);
    if (subscription && subscription.runsUsed >= subscription.runsIncluded) {
      throw new ApiError(403, "Monthly run limit reached for your plan. Please upgrade to run more analyses.");
    }

    const run = await runRepository.create({
      organizationId,
      triggeredBy: userId,
      triggerType: "manual",
      status: "queued",
    } as any);

    await enqueueRun(run._id.toString(), organizationId);

    if (subscription) {
      subscription.runsUsed += 1;
      await subscription.save();
    }

    return run;
  },

  stopRun: async (organizationId: string, runId: string) => {
    const run = await runRepository.findById(runId);
    if (!run || run.organizationId.toString() !== organizationId) {
      throw new ApiError(404, "Run not found");
    }
    if (run.status !== "queued" && run.status !== "running") {
      throw new ApiError(400, `Cannot stop a run with status "${run.status}"`);
    }

    // if still queued in Redis, remove it outright; if already running,
    // mark cancelled and let the worker check this flag mid-execution
    await cancelQueuedRun(runId);
    run.status = "cancelled";
    run.completedAt = new Date();
    await run.save();

    return run;
  },

  list: async (organizationId: string) => runRepository.findByOrganization(organizationId),

  getById: async (organizationId: string, runId: string) => {
    const run = await runRepository.findById(runId);
    if (!run || run.organizationId.toString() !== organizationId) {
      throw new ApiError(404, "Run not found");
    }
    return run;
  },
};
