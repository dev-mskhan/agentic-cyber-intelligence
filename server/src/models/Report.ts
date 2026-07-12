import { Schema, model } from "mongoose";
import type { IReport } from "../types/report.types.js";
import { RISK_LEVELS, REPORT_STATUSES } from "../constants/report.constants.js";

const ReportSchema = new Schema<IReport>(
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
      unique: true,
    },
    status: {
      type: String,
      enum: REPORT_STATUSES,
      required: true,
      default: "draft",
    },
    riskLevel: { type: String, enum: RISK_LEVELS, required: true },
    executiveSummary: { type: String, required: true },
    reportBody: { type: String, required: true },
    complianceNotes: { type: String },
    threatCount: { type: Number, default: 0 },
    vulnerabilityCount: { type: Number, default: 0 },
    mitigationCount: { type: Number, default: 0 },
    generatedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true },
);

ReportSchema.index({ organizationId: 1, generatedAt: -1 });

export default model<IReport>("Report", ReportSchema);
