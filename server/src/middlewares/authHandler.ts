import type { Request, Response, NextFunction } from "express";
import ApiError from "../utils/apiError.js";
import { type JwtPayload, verifyAccessToken } from "../utils/generateToken.js";

const authHandler = (req: Request, res: Response, next: NextFunction) => {
  const token = req.signedCookies?.access_token;
  if (!token) throw new ApiError(401, "Unauthorized");
  try {
    const user = verifyAccessToken(token) as JwtPayload;
    (req as Request & { user: JwtPayload }).user = user;
    next();
  } catch (error) {
    next(new ApiError(401, "Unauthorized"));
  }
};

export const optionalAuth = (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  const token = req.signedCookies?.access_token;
  if (!token) return next();
  try {
    const user = verifyAccessToken(token) as JwtPayload;
    (req as any).user = user;
  } catch {}
  next();
};

export default authHandler;
