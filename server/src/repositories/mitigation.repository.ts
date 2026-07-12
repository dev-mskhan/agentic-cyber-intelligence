import Mitigation from "../models/Mitigation.js";
import type { IMitigation } from "../types/mitigation.types.js";
import type { ClientSession } from "mongoose";

export const mitigationRepository = {
  bulkCreate: (rows: Partial<IMitigation>[], session?: ClientSession) =>
    Mitigation.insertMany(rows, session ? { session, ordered: false } : { ordered: false }),
  findByRun: (runId: string) => Mitigation.find({ runId }).sort({ priority: -1 }).populate("vulnerabilityId"),
  deleteAllByOrganization: (organizationId: string, session?: ClientSession) =>
    Mitigation.deleteMany({ organizationId }, session ? { session } : {}),
  toggleCompleted: (id: string, organizationId: string, isCompleted: boolean) =>
    Mitigation.findOneAndUpdate({ _id: id, organizationId }, { isCompleted }, { new: true }),
};
