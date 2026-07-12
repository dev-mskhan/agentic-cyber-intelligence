import { z } from "zod";
import { PLAN_TIERS } from "../constants/subscription.constants.js";

export const createCheckoutSessionSchema = z.object({
  body: z.object({
    planTier: z.enum(
      PLAN_TIERS.filter((t) => t !== "free") as [string, ...string[]],
    ),
  }),
});

export type CreateCheckoutSessionInput = z.infer<
  typeof createCheckoutSessionSchema
>;
