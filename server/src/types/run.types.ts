import { Document, Types } from "mongoose";
import {
  RUN_STATUSES,
  RUN_TRIGGER_TYPES,
  RUN_STAGES,
} from "../constants/run.constants.js";

export type RunStatus = (typeof RUN_STATUSES)[number];
export type RunTriggerType = (typeof RUN_TRIGGER_TYPES)[number];
export type RunStage = (typeof RUN_STAGES)[number];

export interface IRun extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  triggeredBy: Types.ObjectId; // User._id — who kicked it off (or the system, for scheduled runs)
  triggerType: RunTriggerType;
  status: RunStatus;
  currentStage?: RunStage | undefined;
  bullJobId?: string; // BullMQ job id, for cross-referencing queue state
  startedAt?: Date;
  completedAt?: Date;
  failureReason?: string;
  errorCount: number;
  createdAt: Date;
  updatedAt: Date;
}
