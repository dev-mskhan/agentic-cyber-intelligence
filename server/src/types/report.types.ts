import { Document, Types } from "mongoose";
import { RISK_LEVELS, REPORT_STATUSES } from "../constants/report.constants.js";

export type RiskLevel = (typeof RISK_LEVELS)[number];
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export interface IReport extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  runId: Types.ObjectId;
  status: ReportStatus;
  riskLevel: RiskLevel;
  executiveSummary: string;
  reportBody: string; // full structured report content (markdown or rich text)
  complianceNotes?: string; // compliance-aware phrasing tied to the org's declared frameworks
  threatCount: number;
  vulnerabilityCount: number;
  mitigationCount: number;
  generatedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
