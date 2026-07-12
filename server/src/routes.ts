import { Router } from "express";
import authRoutes from "./routes/auth.routes.js";
import organizationRoutes from "./routes/organization.routes.js";
import technologyRoutes from "./routes/technology.routes.js";
import subscriptionRoutes from "./routes/subscription.routes.js";
import teamRoutes from "./routes/team.routes.js";
import runRoutes from "./routes/run.routes.js";
import reportRoutes from "./routes/report.routes.js";
import mitigationRoutes from "./routes/mitigation.routes.js";
const router = Router();

router.use("/auth", authRoutes);
router.use("/organization", organizationRoutes);
router.use("/technology", technologyRoutes);
router.use("/subscription", subscriptionRoutes);
router.use("/team", teamRoutes);
router.use("/run", runRoutes);
router.use("/report", reportRoutes);
router.use("/mitigation", mitigationRoutes);

export default router;
