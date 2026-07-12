import type { Response } from "express";
import {
  attachCookieToResponse,
  generateAccessToken,
  generateRefreshToken,
  createJwtPayload,
} from "./generateToken.js";
import ApiResponse from "./apiResponse.js";
import type { IUser } from "../models/User.js";

export const issueTokensAndRespond = async (
  res: Response,
  user: IUser,
  isOnboarded: boolean,
  statusCode: number,
  message: string
) => {
  const payload = createJwtPayload(user);
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);
  user.refreshToken = refreshToken;
  await user.save();
  attachCookieToResponse(res, accessToken, refreshToken);
  return res.status(statusCode).json(new ApiResponse(statusCode, {user, isOnboarded}, message));
};
