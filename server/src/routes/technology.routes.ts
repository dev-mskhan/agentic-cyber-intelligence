import { Router } from "express";
import validateRequest from "../middlewares/validateRequest.js";
import {
  createTechnologySchema,
  bulkCreateTechnologySchema,
  catalogSearchSchema,
} from "../validations/technology.validation.js";
import {
  addTechnology,
  bulkAddTechnology,
  listTechnology,
  removeTechnology,
  searchCatalog,
} from "../controllers/technology.controller.js";
import authHandler from "../middlewares/authHandler.js";
import attachOrgId from "../middlewares/attachOrgId.js";

const router = Router();
router.use(authHandler);
router.use(attachOrgId);
router.get(
  "/catalog/search",
  validateRequest(catalogSearchSchema),
  searchCatalog,
);
router.get("/", listTechnology);
router.post("/", validateRequest(createTechnologySchema), addTechnology);
router.post(
  "/bulk",
  validateRequest(bulkCreateTechnologySchema),
  bulkAddTechnology,
);
router.delete("/:id", removeTechnology);

export default router;
