import { Router } from "express";
import authHandler from "../middlewares/authHandler.js";
import attachOrgId from "../middlewares/attachOrgId.js";
import roleCheck from "../middlewares/roleCheck.js";
import validateRequest from "../middlewares/validateRequest.js";
import {
  inviteMemberSchema,
  updateSchema,
  acceptInviteSchema,
} from "../validations/team.validation.js";
import {
  listMembers,
  inviteMember,
  acceptInvite,
  updateMember,
  removeMember,
} from "../controllers/team.controller.js";

const router = Router();

// PUBLIC — must be registered before authHandler is applied below
router.post("/accept-invite/:token", validateRequest(acceptInviteSchema), acceptInvite);

router.use(authHandler);
router.use(attachOrgId);

router.get("/", listMembers);
router.post("/invite", roleCheck("admin"), validateRequest(inviteMemberSchema), inviteMember);
router.patch("/:userId/update", roleCheck("admin"), validateRequest(updateSchema), updateMember);
router.delete("/:userId", roleCheck("admin"), removeMember);

export default router;
