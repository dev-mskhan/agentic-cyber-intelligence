import type { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import { teamService } from "../services/team.service.js";
import { issueTokensAndRespond } from "../utils/issueAuthTokens.js";
import type { JwtPayload } from "../utils/generateToken.js";

export const listMembers = asyncHandler(async (req: Request, res: Response) => {
  const {users, notifyEmails} = await teamService.list((req as any).organizationId as string);
  res.json(new ApiResponse(200, { users, notifyEmails }, "Team members fetched"));
});

export const inviteMember = asyncHandler(async (req: Request, res: Response) => {
  const inviter = (req as any).user as JwtPayload;
  const { email, role } = req.body;
  const user = await teamService.invite((req as any).organizationId as string, inviter.name, email, role);
  res.status(201).json(new ApiResponse(201, user, "Invite sent"));
});

// Public — no session exists yet. Accepting sets the real name/password
// and logs the user in immediately, same pattern as email verification.
export const acceptInvite = asyncHandler(async (req: Request, res: Response) => {
  const { name, password } = req.body;
  const user = await teamService.acceptInvite(req.params.token as string, name, password);
  await issueTokensAndRespond(res,user, true, 200,  "Invite accepted, welcome aboard");
});

export const updateMember = asyncHandler(async (req: Request, res: Response) => {
  const requester = (req as any).user as JwtPayload;
  const user = await teamService.update((req as any).organizationId as string, req.params.userId as string, req.body.role, req.body.emailNotify, requester.id);
  res.json(new ApiResponse(200, user, "Role updated"));
});

export const removeMember = asyncHandler(async (req: Request, res: Response) => {
  const requester = (req as any).user as JwtPayload;
  await teamService.remove((req as any) .organizationId as string, req.params.userId as string, requester.id);
  res.json(new ApiResponse(200, null, "Member removed"));
});
