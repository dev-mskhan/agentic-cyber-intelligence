import { Schema, model } from "mongoose";
import type { IThreat } from "../types/threat.types.js";
import {
  THREAT_SEVERITY_LEVELS,
  THREAT_CATEGORIES,
} from "../constants/threat.constants.js";

const ThreatSchema = new Schema<IThreat>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    runId: {
      type: Schema.Types.ObjectId,
      ref: "Run",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: THREAT_CATEGORIES,
      required: true,
      default: "other",
    },
    severity: { type: String, enum: THREAT_SEVERITY_LEVELS, required: true },
    sourceUrl: { type: String },
    sourceName: { type: String },
    publishedAt: { type: Date },
    relevantIndustries: { type: [String], default: [] },
  },
  { timestamps: true },
);

ThreatSchema.index({ runId: 1, severity: 1 });

export default model<IThreat>("Threat", ThreatSchema);
