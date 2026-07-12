import { Router } from "express";
import authHandler from "../middlewares/authHandler.js";
import attachOrgId from "../middlewares/attachOrgId.js";
import roleCheck from "../middlewares/roleCheck.js";
import { startRun, stopRun, listRuns, getRun, streamRunStatus } from "../controllers/run.controller.js";

const router = Router();

router.use(authHandler);
router.use(attachOrgId);

router.get("/", listRuns); // all roles can view
router.get("/:id", getRun);
router.get("/:id/stream", streamRunStatus);

router.post("/", roleCheck("admin", "analyst"), startRun);
router.post("/:id/stop", roleCheck("admin", "analyst"), stopRun);

export default router;
