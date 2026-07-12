export const MITIGATION_PRIORITIES = [
  "low",
  "medium",
  "high",
  "urgent",
] as const;
export const MITIGATION_STATUSES = [
  "recommended",
  "in_progress",
  "completed",
  "dismissed",
] as const;

export const MITIGATION_ACTION_TYPES = [
  "patch",
  "configuration_change",
  "access_control",
  "monitoring",
  "network_segmentation",
  "policy",
  "other",
] as const;
