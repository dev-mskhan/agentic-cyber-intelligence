import { Router } from "express";
import authHandler from "../middlewares/authHandler.js";
import attachOrgId from "../middlewares/attachOrgId.js";
import roleCheck from "../middlewares/roleCheck.js";
import { listReports, getReport, downloadReport, deleteReport } from "../controllers/report.controller.js";

const router = Router();

router.use(authHandler);
router.use(attachOrgId);

router.get("/", listReports); // all roles
router.get("/:id", getReport);
router.get("/:id/download", downloadReport);

router.delete("/:id", roleCheck("admin"), deleteReport); // admin only, per your RBAC table

export default router;
