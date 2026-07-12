import Subscription from "../models/Subscription.js";
import type { ISubscription } from "../types/subscription.types.js";

export const subscriptionRepository = {
  findByOrganization: (organizationId: string) =>
    Subscription.findOne({ organizationId }),

  findByStripeSubscriptionId: (stripeSubscriptionId: string) =>
    Subscription.findOne({ stripeSubscriptionId }),

  create: (data: Partial<ISubscription>) => Subscription.create(data),

  upsertByOrganization: (
    organizationId: string,
    data: Partial<ISubscription>,
  ) =>
    Subscription.findOneAndUpdate(
      { organizationId },
      { $set: data },
      { new: true, upsert: true, runValidators: true },
    ),
};
