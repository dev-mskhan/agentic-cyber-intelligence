import Organization from "../models/Organization.js";
import type { IOrganization } from "../types/organization.types.js";
import type { Types } from "mongoose";

export const organizationRepository = {
  findById: (id: string | Types.ObjectId) => Organization.findById(id),

  updateStep1: (id: string, data: Partial<IOrganization>) =>
    Organization.findByIdAndUpdate(
      id,
      { ...data, onboardingStep: 2 },
      { new: true, runValidators: true },
    ),

    // repositories/organization.repository.ts
    updateStep3: (id: string, prefs: Pick<IOrganization["notificationPreferences"], "reportFrequency" | "minSeverity">) =>
      Organization.findByIdAndUpdate(
        id,
        {
          "notificationPreferences.reportFrequency": prefs.reportFrequency,
          "notificationPreferences.minSeverity": prefs.minSeverity,
          onboardingStep: 4,
          isOnboarded: true,
        },
        { new: true, runValidators: true }
      ),

  advanceStep: (id: string, step: 1 | 2 | 3 | 4) =>
    Organization.findByIdAndUpdate(id, { onboardingStep: step }, { new: true }),

  setStripeCustomerId: (id: string, stripeCustomerId: string) =>
    Organization.findByIdAndUpdate(id, { stripeCustomerId }, { new: true }),

  findByStripeCustomerId: (stripeCustomerId: string) =>
    Organization.findOne({ stripeCustomerId }),
};
