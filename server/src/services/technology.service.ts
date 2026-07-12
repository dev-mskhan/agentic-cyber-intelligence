import { technologyRepository } from "../repositories/technology.repository.js";
import { organizationRepository } from "../repositories/organization.repository.js";
import { organizationService } from "./organization.service.js";
import ApiError from "../utils/apiError.js";
import type { ITechnologyInventory } from "../types/technologyInventory.types.js";
import { productCatalogRepository } from "../repositories/productCatalog.repository.js";
import { enqueueCatalogRefresh } from "../jobs/queue.js";
import logger from "../config/logger.js";
const MIN_RESULTS_BEFORE_LIVE_FALLBACK = 4;
export const technologyService = {
  addOne: async (
    organizationId: string,
    data: Partial<ITechnologyInventory>,
  ) => {
    const org = await organizationRepository.findById(organizationId);
    if (!org) throw new ApiError(404, "Organization not found");

    const row = await technologyRepository.create({
      ...data,
      organizationId: org._id,
    });

    // first technology row added -> move onboarding from step 2 to step 3
    if (org.onboardingStep === 2) {
      await organizationService.advanceToStep3(organizationId);
    }

    return row;
  },

  addBulk: async (
    organizationId: string,
    rows: Partial<ITechnologyInventory>[],
  ) => {
    const org = await organizationRepository.findById(organizationId);
    if (!org) throw new ApiError(404, "Organization not found");

    const prepared = rows.map((r) => ({ ...r, organizationId: org._id }));
    const created = await technologyRepository.bulkCreate(prepared);

    if (org.onboardingStep === 2) {
      await organizationService.advanceToStep3(organizationId);
    }

    return created;
  },

  list: async (organizationId: string) =>
    technologyRepository.findByOrganization(organizationId),

  remove: async (organizationId: string, id: string) => {
    const deleted = await technologyRepository.deleteById(id, organizationId);
    if (!deleted) throw new ApiError(404, "Technology entry not found");
    return deleted;
  },
  search: async (query: string) => {
    const localResults = await productCatalogRepository.search(query, 10);

    if (localResults.length >= MIN_RESULTS_BEFORE_LIVE_FALLBACK) {
      return { results: localResults, refreshTriggered: false };
    }

    // thin/no local results — return what we have immediately,
    // and kick off a background refresh rather than blocking this request
    logger.info(
      { query, localCount: localResults.length },
      "Triggering background catalog refresh",
    );
    enqueueCatalogRefresh(query).catch((err: unknown) =>
      logger.error({ err, query }, "Failed to enqueue catalog refresh"),
    );

    return { results: localResults, refreshTriggered: true };
  },
};
