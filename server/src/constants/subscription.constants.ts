export const PLAN_TIERS = ["free", "starter", "pro", "enterprise"] as const;

export const PLAN_RUNS: Record<(typeof PLAN_TIERS)[number], number> = {
  free: 20,
  starter: 200,
  pro: 1000,
  enterprise: 5000,
};
export const PLAN_PRICES: Record<(typeof PLAN_TIERS)[number], number> = {
  free: 0,
  starter: 20,
  pro: 100,
  enterprise: 500,
};
export const PLAN_DURATION: Record<(typeof PLAN_TIERS)[number], number> = {
  free: 1,
  starter: 2,
  pro: 12,
  enterprise: 36,
};
export const SUBSCRIPTION_STATUSES = [
  "active",
  "trialing",
  "past_due",
  "canceled",
  "incomplete",
  "incomplete_expired",
  "unpaid",
] as const;
