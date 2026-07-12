import type { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import { subscriptionService } from "../services/subscription.service.js";
import { PLAN_TIERS, PLAN_RUNS, PLAN_PRICES, PLAN_DURATION } from "../constants/subscription.constants.js";

export const createCheckoutSession = asyncHandler(
  async (req: Request, res: Response) => {
    const { checkoutUrl } = await subscriptionService.createCheckoutSession(
      (req as any).organizationId! as string,
      req.body.planTier,
    );
    res.json(new ApiResponse(200, { checkoutUrl }, "Checkout session created"));
  },
);
export const createPortalSession = asyncHandler(async (req: Request, res: Response) => {
  const { portalUrl } = await subscriptionService.createPortalSession((req as any).organizationId as string);
  res.json(new ApiResponse(200, { portalUrl }, "Billing portal session created"));
});
export const getSubscription = asyncHandler(
  async (req: Request, res: Response) => {
    const sub = await subscriptionService.getByOrganization(
      (req as any).organizationId! as string,
    );
    res.json(new ApiResponse(200, sub, "Subscription fetched"));
  },
);

export const getSubsriptionPlans = asyncHandler(
  async (req: Request, res: Response) => {
    const plans = PLAN_TIERS.map((tier) => ({
      tier,
      runs: PLAN_RUNS[tier],
      price: PLAN_PRICES[tier],
      durationInMonths: PLAN_DURATION[tier],
    }));

    res.status(200).json(new ApiResponse(200, plans, "Subscription plans fetched successfully"));
  }
);
