import env from "./env.js";
import type { PlanTier } from "../types/subscription.types.js";

export const PLAN_TO_PRICE_ID: Record<Exclude<PlanTier, "free">, string> = {
  starter: env.stripePriceStarter,
  pro: env.stripePricePro,
  enterprise: env.stripePriceEnterprise,
};

// reverse lookup used by the webhook to figure out which tier a Stripe price maps to
export const PRICE_ID_TO_PLAN: Record<
  string,
  Exclude<PlanTier, "free">
> = Object.entries(PLAN_TO_PRICE_ID).reduce(
  (acc, [tier, priceId]) => {
    acc[priceId] = tier as Exclude<PlanTier, "free">;
    return acc;
  },
  {} as Record<string, Exclude<PlanTier, "free">>,
);
