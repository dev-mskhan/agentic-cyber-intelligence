import type { Request, Response } from "express";
import stripe from "../config/stripe.js";
import env from "../config/env.js";
import logger from "../config/logger.js";
import { subscriptionService } from "../services/subscription.service.js";
import type Stripe from "stripe";

export const handleStripeWebhook = async (req: Request, res: Response) => {
  const signature = req.headers["stripe-signature"];
  let event: Stripe.Event;

  try {
    // req.body must be the RAW buffer here, not JSON-parsed — see app.ts wiring
    event = stripe.webhooks.constructEvent(
      req.body,
      signature as string,
      env.stripeWebhookSecret,
    );
  } catch (err) {
    logger.error({ err }, "Stripe webhook signature verification failed");
    return res.status(400).send(`Webhook Error: ${(err as Error).message}`);
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await subscriptionService.handleCheckoutCompleted(
          event.data.object as Stripe.Checkout.Session,
        );
        break;
      case "customer.subscription.updated":
        await subscriptionService.handleSubscriptionUpdated(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "customer.subscription.deleted":
        await subscriptionService.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;
      case "invoice.payment_failed":
        await subscriptionService.handlePaymentFailed(
          event.data.object as Stripe.Invoice,
        );
        break;
      default:
        logger.info({ eventType: event.type }, "Unhandled Stripe event type");
    }

    res.json({ received: true });
  } catch (err) {
    logger.error(
      { err, eventType: event.type },
      "Error processing Stripe webhook",
    );
    // still return 200 so Stripe doesn't endlessly retry a bug in our handler —
    // log it for manual investigation instead
    res.status(200).json({ received: true, processingError: true });
  }
};
