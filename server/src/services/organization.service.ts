import { organizationRepository } from "../repositories/organization.repository.js";
import ApiError from "../utils/apiError.js";
import type { IOrganization } from "../types/organization.types.js";
import { subscriptionRepository } from "../repositories/subscription.repository.js";
import { reportRepository } from "../repositories/report.repository.js";
import { threatRepository } from "../repositories/threat.repository.js";
import { vulnerabilityRepository } from "../repositories/vulnerability.repository.js";
import { mitigationRepository } from "../repositories/mitigation.repository.js";
import Run from "../models/Run.js";
import TechnologyInventory from "../models/TechnologyInventory.js";
import User from "../models/User.js";
import Organization from "../models/Organization.js";
import { removeRepeatingRun } from "../jobs/runQueue.js";
import stripe from "../config/stripe.js";
import logger from "../config/logger.js";
import mongoose from "mongoose";
import Subscription from "../models/Subscription.js";

export const organizationService = {
  getById: async (id: string) => {
    const org = await organizationRepository.findById(id);
    if (!org) throw new ApiError(404, "Organization not found");
    return org;
  },

  completeStep1: async (
    id: string,
    data: Pick<
      IOrganization,
      "industry" | "companySize" | "complianceFrameworks"
    >,
  ) => {
    const org = await organizationRepository.updateStep1(id, data);
    if (!org) throw new ApiError(404, "Organization not found");
    return org;
  },

  // called after step 2 (technology) has at least one row — see technology.service.ts
  advanceToStep3: async (id: string) => {
    const org = await organizationRepository.advanceStep(id, 3);
    if (!org) throw new ApiError(404, "Organization not found");
    return org;
  },
  completeStep3: async (
    id: string,
    notificationPreferences: IOrganization["notificationPreferences"],
  ) => {
    const org = await organizationRepository.updateStep3(
      id,
      notificationPreferences,
    );
    if (!org) throw new ApiError(404, "Organization not found");

    const existing = await subscriptionRepository.findByOrganization(id);
    if (!existing) {
      await subscriptionRepository.create({
        organizationId: org._id,
        planTier: "free",
        status: "active",
      });
    }

    return org;
  },
  deleteOrganization: async (organizationId: string, confirmName: string) => {
    const org = await organizationRepository.findById(organizationId);
    if (!org) throw new ApiError(404, "Organization not found");

    if (confirmName.trim() !== org.name) {
      throw new ApiError(400, "Confirmation name does not match the organization name");
    }

    // cancel Stripe subscription first, before touching the DB —
    // avoids leaving a live, billing customer with no corresponding org
    const subscription = await subscriptionRepository.findByOrganization(organizationId);
    if (subscription?.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.cancel(subscription.stripeSubscriptionId);
      } catch (err) {
        logger.error({ err, organizationId }, "Failed to cancel Stripe subscription during org deletion");
        // don't block deletion on a Stripe API hiccup — log it for manual cleanup
      }
    }

    await removeRepeatingRun(organizationId); // stop any scheduled runs in BullMQ

    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      await Promise.all([
        reportRepository.deleteAllByOrganization(organizationId, session),
        threatRepository.deleteAllByOrganization(organizationId, session),
        vulnerabilityRepository.deleteAllByOrganization(organizationId, session),
        mitigationRepository.deleteAllByOrganization(organizationId, session),
        Run.deleteMany({ organizationId }, { session }),
        TechnologyInventory.deleteMany({ organizationId }, { session }),
        Subscription.deleteMany({ organizationId }, { session }),
        User.deleteMany({ organizationId }, { session }),
      ]);

      await Organization.findByIdAndDelete(organizationId, { session });

      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw new ApiError(500, "Failed to delete organization");
    } finally {
      session.endSession();
    }

    logger.info({ organizationId, orgName: org.name }, "Organization deleted");
  },
};
