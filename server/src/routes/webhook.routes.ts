import { Router } from "express";
import { handleStripeWebhook } from "../controllers/webhook.controller.js";

const router = Router();

// no validateRequest here — Stripe's payload isn't JSON-parsed at this point (raw buffer),
// and signature verification happens inside the controller itself
router.post("/stripe", handleStripeWebhook);

export default router;
