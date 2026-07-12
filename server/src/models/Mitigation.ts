import { Schema, model } from "mongoose";
import type { IMitigation } from "../types/mitigation.types.js";
import {
  MITIGATION_PRIORITIES,
  MITIGATION_STATUSES,
  MITIGATION_ACTION_TYPES,
} from "../constants/mitigation.constants.js";

const MitigationSchema = new Schema<IMitigation>(
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
    vulnerabilityId: {
      type: Schema.Types.ObjectId,
      ref: "Vulnerability",
      required: true,
    },
    title: { type: String, required: true, trim: true },
    recommendation: { type: String, required: true },
    actionType: {
      type: String,
      enum: MITIGATION_ACTION_TYPES,
      required: true,
      default: "other",
    },
    priority: { type: String, enum: MITIGATION_PRIORITIES, required: true },
    status: {
      type: String,
      enum: MITIGATION_STATUSES,
      required: true,
      default: "recommended",
    },
    estimatedEffort: { type: String },
    isCompleted: { type: Boolean, default: false }
  },
  { timestamps: true },
);

MitigationSchema.index({ runId: 1, priority: 1 });
MitigationSchema.index({ vulnerabilityId: 1 });

export default model<IMitigation>("Mitigation", MitigationSchema);
