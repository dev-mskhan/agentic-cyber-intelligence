import type { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import { organizationService } from "../services/organization.service.js";
import User from "../models/User.js";

export const getOrganization = asyncHandler(
  async (req: Request, res: Response) => {
    const organizationId = (req as any).organizationId as string;
    const org = await organizationService.getById(organizationId);
    const user = await User.findById(org.createdBy?.toString());
    res.json(new ApiResponse(200, { org, user }, "Organization fetched"));
  },
);
export const deleteOrganization = asyncHandler(async (req: Request, res: Response) => {
  await organizationService.deleteOrganization((req as any).organizationId! as string, req.body.confirmName);
  res.json(new ApiResponse(200, null, "Organization deleted"));
});
export const completeOnboardingStep1 = asyncHandler(
  async (req: Request, res: Response) => {
    const organizationId = (req as any).organizationId as string;
    const org = await organizationService.completeStep1(
      organizationId,
      req.body,
    );
    res.json(new ApiResponse(200, org, "Company profile saved"));
  },
);

export const completeOnboardingStep3 = asyncHandler(
  async (req: Request, res: Response) => {
    const organizationId = (req as any).organizationId as string;

    const org = await organizationService.completeStep3(
      organizationId,
      req.body,
    );
    res.json(new ApiResponse(200, org, "Onboarding complete"));
  },
);
