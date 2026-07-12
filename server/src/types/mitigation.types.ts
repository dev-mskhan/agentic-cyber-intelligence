import { Document, Types } from "mongoose";
import {
  MITIGATION_PRIORITIES,
  MITIGATION_STATUSES,
  MITIGATION_ACTION_TYPES,
} from "../constants/mitigation.constants.js";

export type MitigationPriority = (typeof MITIGATION_PRIORITIES)[number];
export type MitigationStatus = (typeof MITIGATION_STATUSES)[number];
export type MitigationActionType = (typeof MITIGATION_ACTION_TYPES)[number];

export interface IMitigation extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  runId: Types.ObjectId;
  vulnerabilityId: Types.ObjectId; // the specific CVE this recommendation addresses
  title: string;
  recommendation: string;
  actionType: MitigationActionType;
  priority: MitigationPriority;
  status: MitigationStatus;
  estimatedEffort?: string;
  isCompleted: boolean; // e.g. "low", "1-2 hours", freeform from the LLM
  createdAt: Date;
  updatedAt: Date;
}
