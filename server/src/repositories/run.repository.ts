import Run from "../models/Run.js";
import type { IRun, RunStage } from "../types/run.types.js";
import type { ClientSession } from "mongoose";

export const runRepository = {
  create: (data: Partial<IRun>) => Run.create(data),
  findById: (id: string) => Run.findById(id),
  findByOrganization: (organizationId: string, limit = 50) =>
    Run.find({ organizationId }).sort({ createdAt: -1 }).limit(limit),
  updateStatus: (id: string, status: IRun["status"], extra: Partial<IRun> = {}) =>
    Run.findByIdAndUpdate(id, { status, ...extra }, { new: true }),
  countActiveByOrganization: (organizationId: string) =>
    Run.countDocuments({ organizationId, status: { $in: ["queued", "running"] } }),
};

export async function updateRunStage(runId: string, stage: RunStage) {
  await Run.findByIdAndUpdate(runId, { currentStage: stage });
}
