import { Queue } from "bullmq";
import { redisConnection } from "../config/redis.js";
import logger from "../config/logger.js";

interface BaseEmailJob {
  to: string;
  subject: string;
  html: string;
  correlationId?: string;
}

export type EmailJobData =
  | (BaseEmailJob & { type: "report"; organizationId: string; reportId: string; recipient: string })
  | (BaseEmailJob & { type: "email_verification"; userId: string })
  | (BaseEmailJob & { type: "password_reset"; userId: string })
  | (BaseEmailJob & { type: "team_invite"; organizationId: string; userId: string });

export type EmailType = EmailJobData["type"];

export const emailQueue = new Queue<EmailJobData>("emailQueue", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000, // 5s, then 10s, then 20s between retries
    },
    removeOnComplete: {
      age: 24 * 60 * 60, // keep completed jobs for 24h, then auto-clean
      count: 1000,
    },
    removeOnFail: {
      age: 7 * 24 * 60 * 60, // keep failed jobs for 7 days for debugging
    },
  },
});

emailQueue.on("error", (err) => {
  logger.error({ error: err }, "Email queue error");
});

export interface CatalogRefreshJobData {
  query: string;
}

export const catalogQueue = new Queue<CatalogRefreshJobData>("catalogQueue", {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 2,
    backoff: { type: "exponential", delay: 3000 },
    removeOnComplete: { age: 60 * 60, count: 500 }, // 1h retention, this is a low-value job history
    removeOnFail: { age: 24 * 60 * 60 },
  },
});

catalogQueue.on("error", (err) => {
  console.error("Catalog queue error:", err);
});

// Enqueue a refresh, deduped by query so the same search term fired by
// multiple users within a short window doesn't trigger redundant NVD calls.
export async function enqueueCatalogRefresh(query: string) {
  const normalized = query.trim().toLowerCase();
  await catalogQueue.add(
    "refresh-catalog",
    { query: normalized },
    {
      jobId: `catalog-refresh-${normalized.replace(/\s+/g, "-")}`,
    }
  );
}
