import { Schema, model } from "mongoose";
import type { IOrganization } from "../types/organization.types.js";
import {
  COMPLIANCE_FRAMEWORKS,
  COMPANY_SIZES,
  INDUSTRIES,
} from "../constants/organization.constants.js";

const OrganizationSchema = new Schema<IOrganization>(
  {
    name: { type: String, required: true, trim: true, unique: true },
    stripeCustomerId: { type: String, unique: true, sparse: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", unique: true },

    industry: { type: String, enum: INDUSTRIES },
    companySize: { type: String, enum: COMPANY_SIZES },
    complianceFrameworks: {
      type: [String],
      enum: COMPLIANCE_FRAMEWORKS,
      default: ["NONE"],
    },

    notificationPreferences: {
      reportFrequency: {
        type: String,
        enum: ["daily", "weekly"],
        default: "weekly",
      },
      minSeverity: {
        type: String,
        enum: ["all", "medium", "high"],
        default: "all",
      },
      notifyEmails: { type: [String], default: [] },
    },

    onboardingStep: { type: Number, enum: [1, 2, 3, 4], default: 1 },
    isOnboarded: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export default model<IOrganization>("Organization", OrganizationSchema);
