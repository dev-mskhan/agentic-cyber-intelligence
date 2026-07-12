import { Router } from "express";
import authHandler from "../middlewares/authHandler.js";
import attachOrgId from "../middlewares/attachOrgId.js";
import roleCheck from "../middlewares/roleCheck.js";
import validateRequest from "../middlewares/validateRequest.js";
import { deleteOrganizationSchema } from "../validations/organization.validation.js";
import { deleteOrganization } from "../controllers/organization.controller.js";
import {
  onboardingStep1Schema,
  onboardingStep3Schema,
} from "../validations/organization.validation.js";
import {
  getOrganization,
  completeOnboardingStep1,
  completeOnboardingStep3,
} from "../controllers/organization.controller.js";

const router = Router();

router.use(authHandler);
router.use(attachOrgId);

router.get("/", getOrganization);

router.patch(
  "/onboarding/step-1",
  roleCheck("admin"),
  validateRequest(onboardingStep1Schema),
  completeOnboardingStep1,
);

router.patch(
  "/onboarding/step-3",
  roleCheck("admin"),
  validateRequest(onboardingStep3Schema),
  completeOnboardingStep3,
);

router.delete(
  "/",
  roleCheck("admin"),
  validateRequest(deleteOrganizationSchema),
  deleteOrganization
);
export default router;
