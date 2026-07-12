import { scheduleRepeatingRun, removeRepeatingRun } from "./runQueue.js";
import type { PlanTier } from "../types/subscription.types.js";

// Free tier gets no automatic schedule — manual runs only.
const PLAN_CADENCE: Record<PlanTier, "daily" | "weekly" | null> = {
  free: null,
  starter: "weekly",
  pro: "weekly",
  enterprise: "daily",
};

export async function syncScheduleForPlan(organizationId: string, planTier: PlanTier) {
  const cadence = PLAN_CADENCE[planTier];
  if (!cadence) {
    await removeRepeatingRun(organizationId);
    return;
  }
  await scheduleRepeatingRun(organizationId, cadence);
}
