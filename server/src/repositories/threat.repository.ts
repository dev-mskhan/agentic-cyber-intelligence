import Threat from "../models/Threat.js";
import type { IThreat } from "../types/threat.types.js";
import type { ClientSession } from "mongoose";

export const threatRepository = {
  bulkCreate: (rows: Partial<IThreat>[], session?: ClientSession) =>
    Threat.insertMany(rows, session ? { session, ordered: false } : { ordered: false }),
  findByRun: (runId: string) => Threat.find({ runId }).sort({ severity: -1 }),
  deleteAllByOrganization: (organizationId: string, session?: ClientSession) =>
    Threat.deleteMany({ organizationId }, session ? { session } : {}),
};
