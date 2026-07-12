import { Router } from "express";
import authHandler from "../middlewares/authHandler.js";
import attachOrgId from "../middlewares/attachOrgId.js";
import roleCheck from "../middlewares/roleCheck.js";
import validateRequest from "../middlewares/validateRequest.js";
import z from "zod";
import { toggleMitigation } from "../controllers/mitigation.controller.js";

const router = Router();

router.use(authHandler);
router.use(attachOrgId);

// Viewer stays read-only per your RBAC table — toggling is an edit action
router.patch("/:id/toggle", roleCheck("admin", "analyst"), validateRequest(z.object({
  params: z.object({ id: z.string().min(1) }),
  body: z.object({ isCompleted: z.boolean() }),
})), toggleMitigation);

export default router;
