import { Document, Types } from "mongoose";
import {
  PLAN_TIERS,
  SUBSCRIPTION_STATUSES,
} from "../constants/subscription.constants.js";

export type PlanTier = (typeof PLAN_TIERS)[number];
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUSES)[number];

export interface ISubscription extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  planTier: PlanTier;
  status: SubscriptionStatus;
  runsIncluded: number;
  runsUsed: number;
  currentPeriodEnd?: Date | undefined;
  createdAt: Date;
  updatedAt: Date;

  applyPlanTier(newTier: PlanTier, opts?: { resetUsage?: boolean }): void;
}
