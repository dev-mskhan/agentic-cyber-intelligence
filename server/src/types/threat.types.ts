import { Document, Types } from "mongoose";
import {
  THREAT_SEVERITY_LEVELS,
  THREAT_CATEGORIES,
} from "../constants/threat.constants.js";

export type ThreatSeverity = (typeof THREAT_SEVERITY_LEVELS)[number];
export type ThreatCategory = (typeof THREAT_CATEGORIES)[number];

export interface IThreat extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  runId: Types.ObjectId;
  title: string;
  description: string;
  category: ThreatCategory;
  severity: ThreatSeverity;
  sourceUrl?: string; // originating article/advisory found via Exa search
  sourceName?: string; // e.g. "CISA", "BleepingComputer"
  publishedAt?: Date | undefined; // when the underlying threat news was published
  relevantIndustries: string[]; // matched against org's industry for filtering
  createdAt: Date;
  updatedAt: Date;
}
