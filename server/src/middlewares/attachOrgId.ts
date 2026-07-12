import type { Request, Response, NextFunction } from "express";
import ApiError from "../utils/apiError.js";
import type { JwtPayload } from "../utils/generateToken.js";
import logger from "../config/logger.js";

// Derives the organization scope from the authenticated user's JWT,
// rather than trusting a client-supplied URL param.
// Attaches it to req.organizationId for controllers to use.
const attachOrgId = (req: Request, res: Response, next: NextFunction) => {
  const user = (req as Request & { user: JwtPayload }).user;

  if (!user?.organizationId) {
    return next(
      new ApiError(403, "No organization associated with this account"),
    );
  }

  (req as Request & { organizationId: string }).organizationId =
    user.organizationId.toString();
  next();
};

export default attachOrgId;
