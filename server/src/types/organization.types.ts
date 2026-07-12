import type { Document, Types } from "mongoose";
import {
  COMPLIANCE_FRAMEWORKS,
  COMPANY_SIZES,
  INDUSTRIES,
} from "../constants/organization.constants.js";
export interface IOrganization extends Document {
  _id: Types.ObjectId;
  name: string;
  stripeCustomerId?: string;
  createdBy?: Types.ObjectId;
  industry?: Industry;
  companySize?: CompanySize;
  complianceFrameworks: ComplianceFramework[];
  notificationPreferences: INotificationPreferences;
  onboardingStep: 1 | 2 | 3 | 4;
  isOnboarded: boolean;
  createdAt: Date;
  updatedAt: Date;
}
export interface INotificationPreferences {
  reportFrequency: "daily" | "weekly";
  minSeverity: "all" | "medium" | "high";
  notifyEmails: string[];
}
export type ComplianceFramework = (typeof COMPLIANCE_FRAMEWORKS)[number];
export type CompanySize = (typeof COMPANY_SIZES)[number];
export type Industry = (typeof INDUSTRIES)[number];
