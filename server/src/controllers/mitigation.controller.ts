import type { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import ApiError from "../utils/apiError.js";
import { mitigationRepository } from "../repositories/mitigation.repository.js";
import { emitToOrg, EVENTS } from "../events/eventBus.js";

export const toggleMitigation = asyncHandler(async (req: Request, res: Response) => {
  const organizationId = (req as any).organizationId as string;
  const updated = await mitigationRepository.toggleCompleted(
    req.params.id as string,
    organizationId,
    req.body.isCompleted
  );
  if (!updated) throw new ApiError(404, "Mitigation not found");

  await emitToOrg(organizationId, EVENTS.MITIGATION_UPDATED, {
    mitigationId: updated._id.toString(),
    isCompleted: updated.isCompleted,
  });

  res.json(new ApiResponse(200, updated, "Mitigation updated"));
});
