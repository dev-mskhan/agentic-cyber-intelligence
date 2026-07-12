import Report from "../models/Report.js";
import type { IReport } from "../types/report.types.js";
import type { ClientSession } from "mongoose";

export const reportRepository = {
  create: (data: Partial<IReport>, session?: ClientSession) =>
    Report.create([data], session ? { session } : {}).then((docs) => docs[0]),
  findById: (id: string) => Report.findById(id),
  findByRunId: (runId: string) => Report.findOne({ runId }),
  findByOrganization: (organizationId: string, limit = 50) =>
    Report.find({ organizationId }).sort({ generatedAt: -1 }).limit(limit),
  deleteById: (id: string, organizationId: string) =>
    Report.findOneAndDelete({ _id: id, organizationId }),
  deleteAllByOrganization: (organizationId: string, session?: ClientSession) =>
    Report.deleteMany({ organizationId }, session ? { session } : {}),
};
