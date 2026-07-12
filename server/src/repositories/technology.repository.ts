import TechnologyInventory from "../models/TechnologyInventory.js";
import type { ITechnologyInventory } from "../types/technologyInventory.types.js";

export const technologyRepository = {
  create: (data: Partial<ITechnologyInventory>) =>
    TechnologyInventory.create(data),

  bulkCreate: (rows: Partial<ITechnologyInventory>[]) =>
    TechnologyInventory.insertMany(rows, { ordered: false }),

  findByOrganization: (organizationId: string) =>
    TechnologyInventory.find({ organizationId }).sort({ createdAt: -1 }),

  countByOrganization: (organizationId: string) =>
    TechnologyInventory.countDocuments({ organizationId }),

  deleteById: (id: string, organizationId: string) =>
    TechnologyInventory.findOneAndDelete({ _id: id, organizationId }),
};
