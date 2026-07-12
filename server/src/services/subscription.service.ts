import stripe from "../config/stripe.js";
import env from "../config/env.js";
import { organizationRepository } from "../repositories/organization.repository.js";
import { syncScheduleForPlan } from "../jobs/subscriptionScheduler.js";
import { subscriptionRepository } from "../repositories/subscription.repository.js";
import { PLAN_TO_PRICE_ID, PRICE_ID_TO_PLAN } from "../config/planCatalog.js";
import ApiError from "../utils/apiError.js";
import logger from "../config/logger.js";
import type Stripe from "stripe";
import type { PlanTier } from "../types/subscription.types.js";
import { removeRepeatingRun } from "../jobs/runQueue.js";
function getCurrentPeriodEnd(subscription: Stripe.Subscription): Date | undefined {
  const periodEnd = subscription.items.data[0]?.current_period_end;
  return periodEnd ? new Date(periodEnd * 1000) : undefined;
}
export const subscriptionService = {
  // --- Checkout session creation (upgrade flow) ---
  createCheckoutSession: async (
    organizationId: string,
    planTier: Exclude<PlanTier, "free">,
  ) => {
    const org = await organizationRepository.findById(organizationId);
    if (!org) throw new ApiError(404, "Organization not found");

    // ensure a Stripe customer exists for this org
    let stripeCustomerId = org.stripeCustomerId;
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        name: org.name,
        metadata: { organizationId: org._id.toString() },
      });
      stripeCustomerId = customer.id;
      await organizationRepository.setStripeCustomerId(
        organizationId,
        stripeCustomerId,
      );
    }

    const priceId = PLAN_TO_PRICE_ID[planTier];
    if (!priceId)
      throw new ApiError(
        400,
        `No Stripe price configured for plan "${planTier}"`,
      );

    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${env.clientUrl}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${env.clientUrl}/billing/cancelled`,
      metadata: { organizationId: org._id.toString(), planTier },
    });

    return { checkoutUrl: session.url };
  },

  getByOrganization: async (organizationId: string) => {
    const sub = await subscriptionRepository.findByOrganization(organizationId);
    if (!sub)
      throw new ApiError(404, "No subscription found for this organization");
    return sub;
  },
  // --- Webhook handlers ---
  handleCheckoutCompleted: async (session: Stripe.Checkout.Session) => {
    const organizationId = session.metadata?.organizationId;
    const planTier = session.metadata?.planTier as Exclude<PlanTier, "free"> | undefined;
    if (!organizationId || !planTier) {
      logger.warn({ sessionId: session.id }, "Checkout session missing metadata");
      return;
    }

    const stripeSubscriptionId = session.subscription as string;
    const subscription = await stripe.subscriptions.retrieve(stripeSubscriptionId);

    await subscriptionRepository.upsertByOrganization(organizationId, {
      stripeSubscriptionId,
      stripeCustomerId: session.customer as string,
      planTier,
      status: subscription.status as any,
      currentPeriodEnd: getCurrentPeriodEnd(subscription), // now resolves correctly
    });

    await syncScheduleForPlan(organizationId, planTier);

    logger.info({ organizationId, planTier }, "Subscription activated via checkout");
  },
  handleSubscriptionUpdated: async (subscription: Stripe.Subscription) => {
    const existing = await subscriptionRepository.findByStripeSubscriptionId(
      subscription.id,
    );
    if (!existing) {
      logger.warn(
        { subscriptionId: subscription.id },
        "Received update for unknown subscription",
      );
      return;
    }

    const priceId = subscription.items.data[0]?.price.id;
    const planTier = priceId ? PRICE_ID_TO_PLAN[priceId] : existing.planTier;

    existing.status = subscription.status as any;
    const periodEnd = getCurrentPeriodEnd(subscription);
    if (periodEnd) existing.currentPeriodEnd = periodEnd;
    if (planTier) existing.applyPlanTier(planTier);
    await existing.save();
    await syncScheduleForPlan(existing.organizationId.toString(), existing.planTier);
    logger.info(
      { subscriptionId: subscription.id, status: subscription.status },
      "Subscription updated",
    );
  },
  createPortalSession: async (organizationId: string) => {
    const org = await organizationRepository.findById(organizationId);
    if (!org) throw new ApiError(404, "Organization not found");
    if (!org.stripeCustomerId) throw new ApiError(400, "No billing account found for this organization");

    const session = await stripe.billingPortal.sessions.create({
      customer: org.stripeCustomerId,
      return_url: `${env.clientUrl}/settings/billing`,
    });

    return { portalUrl: session.url };
  },
  handleSubscriptionDeleted: async (subscription: Stripe.Subscription) => {
    const existing = await subscriptionRepository.findByStripeSubscriptionId(
      subscription.id,
    );
    if (!existing) return;

    existing.status = "canceled";
    await existing.save();
    await removeRepeatingRun(existing.organizationId.toString());
    logger.info({ subscriptionId: subscription.id }, "Subscription canceled");
  },
  handlePaymentFailed: async (invoice: Stripe.Invoice) => {
    const subscriptionId = invoice.parent?.subscription_details?.subscription as string | null;
    if (!subscriptionId) return;

    const existing =
      await subscriptionRepository.findByStripeSubscriptionId(subscriptionId);
    if (!existing) return;

    existing.status = "past_due";
    await existing.save();

    logger.warn(
      { subscriptionId },
      "Payment failed, subscription marked past_due",
    );
  },
};
