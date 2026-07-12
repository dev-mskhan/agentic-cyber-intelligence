import { Document, Types } from "mongoose";
import {
  ENVIRONMENTS,
  CRITICALITY_LEVELS,
} from "../constants/technology.constants.js";

export type Environment = (typeof ENVIRONMENTS)[number];
export type Criticality = (typeof CRITICALITY_LEVELS)[number];

export interface ITechnologyInventory extends Document {
  _id: Types.ObjectId;
  organizationId: Types.ObjectId;
  product: string;
  version: string;
  purpose: string;
  environment: Environment;
  criticality: Criticality;
  catalogRef?: Types.ObjectId | null;
  createdAt: Date;
  updatedAt: Date;
}
