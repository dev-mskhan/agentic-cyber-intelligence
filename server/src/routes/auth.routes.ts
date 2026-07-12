import { Router } from "express";
import validate from "../middlewares/validateRequest.js";
import {
  signupSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  googleAuthSchema,
  verificationStatusSchema,
} from "../validations/auth.validation.js";
import {
  signup,
  verifyEmail,
  login,
  googleAuth,
  refreshAccessToken,
  logout,
  forgotPassword,
  resetPassword,
  getVerificationStatus,
} from "../controllers/auth.controller.js";

const router = Router();

router.post("/signup", validate(signupSchema), signup);
router.get("/verify-email/:token", validate(verifyEmailSchema), verifyEmail);
router.post("/login", validate(loginSchema), login);
router.post("/google", validate(googleAuthSchema), googleAuth);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", logout);
router.post("/forgot-password", validate(forgotPasswordSchema), forgotPassword);
router.post(
  "/reset-password/:token",
  validate(resetPasswordSchema),
  resetPassword,
);
router.get(
  "/verification-status",
  validate(verificationStatusSchema),
  getVerificationStatus
);

export default router;
