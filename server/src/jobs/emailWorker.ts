import { Worker, type Job } from "bullmq";
import { redisConnection } from "../config/redis.js";
import { sendEmail } from "../config/nodemailer.js";
import logger from "../config/logger.js";
import { emitToOrg, emitToUser } from "../events/eventBus.js";
import type { EmailJobData } from "./queue.js";
import { EVENTS, type EventName } from "../events/eventBus.js";
import type { EmailType } from "./queue.js";

const EMAIL_TYPE_EVENTS: Record<EmailType, { sent: EventName; failed: EventName }> = {
  report: { sent: EVENTS.REPORT_EMAIL_SENT, failed: EVENTS.REPORT_EMAIL_FAILED },
  email_verification: { sent: EVENTS.EMAIL_VERIFICATION_SENT, failed: EVENTS.EMAIL_VERIFICATION_FAILED },
  password_reset: { sent: EVENTS.PASSWORD_RESET_EMAIL_SENT, failed: EVENTS.PASSWORD_RESET_EMAIL_FAILED },
  team_invite: { sent: EVENTS.TEAM_INVITE_SENT, failed: EVENTS.TEAM_INVITE_FAILED },
};
const emailWorker = new Worker<EmailJobData>(
  "emailQueue",
  async (job: Job<EmailJobData>) => {
    const { to, subject, html } = job.data;
    await sendEmail({ to, subject, html });
    return { sentTo: to };
  },
  {
    connection: redisConnection,
    concurrency: 5,
    limiter: { max: 10, duration: 1000 },
  },
);

function buildEmailPayload(job: Job<EmailJobData>, extra?: Record<string, unknown>) {
  const { to, correlationId } = job.data;
  const base = { to, correlationId, jobId: job.id, ...extra };

  switch (job.data.type) {
    case "report":
      return { ...base, reportId: job.data.reportId };
    case "team_invite":
      return { ...base, userId: job.data.userId };
    case "email_verification":
    case "password_reset":
      return base; // userId is the emit target, not part of payload
  }
}

function emitEmailEvent(job: Job<EmailJobData>, eventName: EventName, extra?: Record<string, unknown>) {
  const payload = buildEmailPayload(job, extra);

  switch (job.data.type) {
    case "report":
    case "team_invite":
      emitToOrg(job.data.organizationId, eventName, payload);
      break;
    case "email_verification":
    case "password_reset":
      emitToUser(job.data.userId, eventName, payload);
      break;
  }
}

emailWorker.on("completed", (job) => {
  const eventName = EMAIL_TYPE_EVENTS[job.data.type].sent;
  logger.info({ jobId: job.id, type: job.data.type, to: job.data.to, eventName }, "Email sent successfully");
  emitEmailEvent(job, eventName);
});

emailWorker.on("failed", (job, err) => {
  if (!job) return;
  const eventName = EMAIL_TYPE_EVENTS[job.data.type].failed;

  logger.error(
    { jobId: job.id, type: job.data.type, to: job.data.to, attemptsMade: job.attemptsMade, eventName, err },
    "Email job failed",
  );

  if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
    emitEmailEvent(job, eventName, { error: err.message });
  }
});

emailWorker.on("error", (err) => {
  logger.error({ err }, "Email worker error");
});
