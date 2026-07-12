export const RUN_STATUSES = [
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled",
] as const;

export const RUN_TRIGGER_TYPES = ["manual", "scheduled"] as const;

// mirrors the LangGraph pipeline stages, useful for progress tracking in the UI
export const RUN_STAGES = [
  "threat_intelligence",
  "vulnerability_research",
  "incident_response",
  "report_writing",
] as const;
