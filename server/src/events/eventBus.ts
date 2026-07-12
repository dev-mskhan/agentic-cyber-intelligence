import { getIO } from "../config/socket.js";
import redisClient from "../config/redis.js";
import logger from "../config/logger.js";

export const EVENTS = {
  RUN_STARTED: "run_started",
  RUN_COMPLETED: "run_completed",
  RUN_FAILED: "run_failed",

  REPORT_GENERATED: "report_generated",
  MITIGATION_UPDATED: "mitigation_updated",

  // per-email-type pairs, consistent _SENT / _FAILED suffix
  REPORT_EMAIL_SENT: "report_email_sent",
  REPORT_EMAIL_FAILED: "report_email_failed",

  EMAIL_VERIFICATION_SENT: "email_verification_sent",
  EMAIL_VERIFICATION_FAILED: "email_verification_failed",
  EMAIL_VERIFIED: "email_verified",

  PASSWORD_RESET_EMAIL_SENT: "password_reset_email_sent",
  PASSWORD_RESET_EMAIL_FAILED: "password_reset_email_failed",
  PASSWORD_RESET_COMPLETED: "password_reset_completed",

  TEAM_INVITE_SENT: "team_invite_sent",
  TEAM_INVITE_FAILED: "team_invite_failed",
  TEAM_INVITE_ACCEPTED: "team_invite_accepted",
} as const;

export type EventName = (typeof EVENTS)[keyof typeof EVENTS];

interface DomainEvent {
  type: EventName;
  scope: "org" | "user";
  targetId: string;
  payload: unknown;
}

const CHANNEL = "domain-events";

// Safe to call from ANY process — the API process, or a separate worker
// process. Publishes to Redis; only the API process (which owns the
// Socket.IO server) actually forwards it to connected clients.
async function publishEvent(event: DomainEvent) {
  try {
    await redisClient.publish(CHANNEL, JSON.stringify(event));
  } catch (err) {
    logger.error({ err, event }, "Failed to publish domain event");
  }
}

export function emitToOrg(organizationId: string, type: EventName, payload: unknown) {
  return publishEvent({ type, scope: "org", targetId: organizationId, payload });
}

export function emitToUser(userId: string, type: EventName, payload: unknown) {
  return publishEvent({ type, scope: "user", targetId: userId, payload });
}

// Runs ONCE, in the process that owns the Socket.IO server (server.ts).
// Subscribes to the shared Redis channel and rebroadcasts to the right room.
export function startEventBusSubscriber() {
  const subscriber = redisClient.duplicate();

  subscriber.subscribe(CHANNEL, (err) => {
    if (err) logger.error({ err }, "Failed to subscribe to domain event channel");
    else logger.info("Event bus subscriber listening for domain events");
  });

  subscriber.on("message", (_channel, message) => {
    try {
      const event = JSON.parse(message) as DomainEvent;
      const io = getIO();
      const room = event.scope === "org" ? `org:${event.targetId}` : `user:${event.targetId}`;
      io.to(room).emit(event.type, event.payload);
    } catch (err) {
      logger.error({ err, message }, "Failed to process domain event");
    }
  });

  return subscriber;
}
