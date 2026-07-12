import { Queue, type RepeatOptions } from "bullmq";
import {redisConnection} from "../config/redis.js";

export interface RunJobData {
  runId: string;
  organizationId: string;
}

export const runQueue = new Queue<RunJobData>("runQueue", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 10_000 },
    removeOnComplete: { age: 7 * 24 * 60 * 60, count: 500 },
    removeOnFail: { age: 30 * 24 * 60 * 60 },
  },
});

runQueue.on("error", (err) => console.error("Run queue error:", err));

export async function enqueueRun(runId: string, organizationId: string) {
  const job = await runQueue.add("execute-run", { runId, organizationId }, { jobId: `run-${runId}` });
  return job.id;
}

export async function cancelQueuedRun(runId: string) {
  const job = await runQueue.getJob(`run-${runId}`);
  if (job) {
    const state = await job.getState();
    if (state === "waiting" || state === "delayed") {
      await job.remove();
      return true;
    }
  }
  return false;
}

// --- repeatable jobs, cadence driven by plan tier ---
const CADENCE_CRON: Record<string, string> = {
  daily: "0 6 * * *", // 6am daily
  weekly: "0 6 * * 1", // 6am every Monday
};

export async function scheduleRepeatingRun(organizationId: string, frequency: "daily" | "weekly") {
  const repeatJobId = `scheduled-${organizationId}`;
  // remove any existing schedule for this org first (e.g. on plan change)
  const repeatableJobs = await runQueue.getRepeatableJobs();
  const existing = repeatableJobs.find((j) => j.id === repeatJobId);
  if (existing) await runQueue.removeRepeatableByKey(existing.key);

  await runQueue.add(
    "execute-scheduled-run",
    { runId: "", organizationId }, // runId created fresh inside the worker for scheduled runs
    { repeat: { pattern: CADENCE_CRON[frequency] } as RepeatOptions, jobId: repeatJobId }
  );
}

export async function removeRepeatingRun(organizationId: string) {
  const repeatJobId = `scheduled-${organizationId}`;
  const repeatableJobs = await runQueue.getRepeatableJobs();
  const existing = repeatableJobs.find((j) => j.id === repeatJobId);
  if (existing) await runQueue.removeRepeatableByKey(existing.key);
}
