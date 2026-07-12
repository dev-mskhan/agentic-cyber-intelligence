import { Schema, model } from "mongoose";
import type { IRun } from "../types/run.types.js";
import {
  RUN_STATUSES,
  RUN_TRIGGER_TYPES,
  RUN_STAGES,
} from "../constants/run.constants.js";

const RunSchema = new Schema<IRun>(
  {
    organizationId: {
      type: Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    triggeredBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    triggerType: {
      type: String,
      enum: RUN_TRIGGER_TYPES,
      required: true,
      default: "manual",
    },
    status: {
      type: String,
      enum: RUN_STATUSES,
      required: true,
      default: "queued",
    },
    currentStage: { type: String, enum: RUN_STAGES },
    bullJobId: { type: String },
    startedAt: { type: Date },
    completedAt: { type: Date },
    failureReason: { type: String },
    errorCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

RunSchema.index({ organizationId: 1, createdAt: -1 });
RunSchema.index({ organizationId: 1, status: 1 });

export default model<IRun>("Run", RunSchema);
