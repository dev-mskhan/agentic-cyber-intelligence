import { Schema, model } from "mongoose";
import type { ISubscription } from "../types/subscription.types.js";
import {
  PLAN_TIERS,
  PLAN_RUNS,
  SUBSCRIPTION_STATUSES,
} from "../constants/subscription.constants.js";

const SubscriptionSchema = new Schema<ISubscription>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      unique: true,
    },
    stripeSubscriptionId: { type: String, unique: true, sparse: true },
    stripeCustomerId: { type: String },
    planTier: {
      type: String,
      required: true,
      enum: PLAN_TIERS,
      default: "free",
    },
    status: {
      type: String,
      required: true,
      enum: SUBSCRIPTION_STATUSES,
      default: "active",
    },
    runsIncluded: { type: Number, required: true, default: 0 },
    runsUsed: { type: Number, default: 0 },
    currentPeriodEnd: { type: Date },
  },
  { timestamps: true },
);

SubscriptionSchema.pre("validate", function () {
  if (this.isModified("planTier") && !this.isModified("runsIncluded")) {
    this.runsIncluded = PLAN_RUNS[this.planTier];
  }
  return;
});

SubscriptionSchema.methods.applyPlanTier = function (
  newTier: keyof typeof PLAN_RUNS,
  opts: { resetUsage?: boolean } = {},
) {
  this.planTier = newTier;
  this.runsIncluded = PLAN_RUNS[newTier];
  if (opts.resetUsage) this.runsUsed = 0;
};

export default model<ISubscription>("Subscription", SubscriptionSchema);
