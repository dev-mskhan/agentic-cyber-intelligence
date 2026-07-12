import type { Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/apiResponse.js";
import { authService } from "../services/auth.service.js";
import {verifyScopedSocketToken} from "../utils/generateToken.js";
import { issueTokensAndRespond } from "../utils/issueAuthTokens.js";
import User from "../models/User.js";
import ApiError from "../utils/apiError.js";

export const signup = asyncHandler(async (req: Request, res: Response) => {
  const { name, email, password, organizationName } = req.body;
  const { pendingToken } = await authService.signup(
    name,
    email,
    password,
    organizationName,
  );
  res
    .status(201)
    .json(
      new ApiResponse(
        201,
        { email, pendingToken },
        "Signup successful. Please verify your email.",
      ),
    );
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const user = await authService.verifyEmail(req.params.token as string);
  await issueTokensAndRespond(res, user, false, 200, "Email verified successfully");
});

export const login = asyncHandler(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const {user, isOnboarded} = await authService.login(email, password);
  await issueTokensAndRespond(res, user, isOnboarded, 200, "Login successful");
});

export const googleAuth = asyncHandler(async (req: Request, res: Response) => {
  const { idToken, organizationName } = req.body;
  const {user, isOnboarded} = await authService.loginOrSignupWithGoogle(
    idToken,
    organizationName,
  );
  await issueTokensAndRespond(res, user!, isOnboarded, 200, "Google sign-in successful");
});
export const getVerificationStatus = asyncHandler(async (req: Request, res: Response) => {
  const { pendingToken } = req.query as { pendingToken: string };

  let payload;
  try {
    payload = verifyScopedSocketToken(pendingToken, "pending_verification");
  } catch {
    throw new ApiError(401, "Invalid or expired pending token");
  }

  const user = await User.findById(payload.id).select("emailVerified email");
  if (!user) throw new ApiError(404, "User not found");

  res.json(new ApiResponse(200, { emailVerified: user.emailVerified, email: user.email }, "Status fetched"));
});
export const refreshAccessToken = asyncHandler(
  async (req: Request, res: Response) => {
    const token = req.signedCookies?.refresh_token;
    if (!token)
      return res
        .status(401)
        .json(new ApiResponse(401, null, "No refresh token"));
    const user = await authService.refreshAccessToken(token);
    await issueTokensAndRespond(res, user, false, 200, "Token refreshed");
  },
);

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const token = req.signedCookies?.refresh_token;
  await authService.logout(token);
  res
    .clearCookie("refresh_token")
    .clearCookie("access_token")
    .json(new ApiResponse(200, null, "Logged out successfully"));
});

export const forgotPassword = asyncHandler(
  async (req: Request, res: Response) => {
    const { pendingToken } = await authService.forgotPassword(req.body.email);
    res.json(
      new ApiResponse(200, { pendingToken }, "Password reset email sent"),
    );
  },
);

export const resetPassword = asyncHandler(
  async (req: Request, res: Response) => {
    await authService.resetPassword(
      req.params.token as string,
      req.body.password,
    );
    res.json(new ApiResponse(200, null, "Password reset successful"));
  },
);
