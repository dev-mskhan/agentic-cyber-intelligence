import { Router } from "express";
import authHandler from "../middlewares/authHandler.js";
import roleCheck from "../middlewares/roleCheck.js";
import validateRequest from "../middlewares/validateRequest.js";
import { createCheckoutSessionSchema } from "../validations/subscription.validation.js";
import {
  createCheckoutSession,
  createPortalSession,
  getSubscription,
  getSubsriptionPlans,
} from "../controllers/subscription.controller.js";
import attachOrgId from "../middlewares/attachOrgId.js";

const router = Router();

router.use(authHandler);

router.use(attachOrgId);

router.get("/", roleCheck("admin"), getSubscription);
router.post(
  "/checkout",
  roleCheck("admin"),
  validateRequest(createCheckoutSessionSchema),
  createCheckoutSession,
);
router.post("/portal", roleCheck("admin"), createPortalSession);
router.get('/plans', getSubsriptionPlans);
export default router;
