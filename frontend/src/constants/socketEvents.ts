// constants/socketEvents.ts
export const EVENTS = {
  RUN_STARTED: "run_started",
  RUN_COMPLETED: "run_completed",
  RUN_FAILED: "run_failed",
  REPORT_GENERATED: "report_generated",
  MITIGATION_UPDATED: "mitigation_updated",
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
