import { Schema, model } from "mongoose";
import type { ITechnologyInventory } from "../types/technologyInventory.types.js";
import {
  ENVIRONMENTS,
  CRITICALITY_LEVELS,
} from "../constants/technology.constants.js";

const TechnologyInventorySchema = new Schema<ITechnologyInventory>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    product: { type: String, required: true, trim: true },
    version: { type: String, trim: true, default: "unknown" },
    purpose: { type: String, required: true, trim: true },
    environment: {
      type: String,
      required: true,
      enum: ENVIRONMENTS,
      default: "production",
    },
    criticality: {
      type: String,
      required: true,
      enum: CRITICALITY_LEVELS,
      default: "medium",
    },
    catalogRef: {
      type: Schema.Types.ObjectId,
      ref: "ProductCatalog",
      default: null,
    },
  },
  { timestamps: true },
);

TechnologyInventorySchema.index({ organizationId: 1, product: 1, version: 1 });

export default model<ITechnologyInventory>(
  "TechnologyInventory",
  TechnologyInventorySchema,
);
