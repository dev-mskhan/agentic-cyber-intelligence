import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import mongoose from "mongoose";
import ApiError from "../utils/apiError.js";
import logger from "../config/logger.js";

const errorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  let statusCode = 500;
  let message = "Internal Server Error";
  if (res.headersSent) {
    return next(error);
  }
  // custom app error
  if (error instanceof ApiError) {
    statusCode = error.statusCode;
    message = error.message;
  }
  // zod validation
  else if (error instanceof ZodError) {
    statusCode = 400;
    message = error.issues.map((err: any) => err.message).join(", ");
  }
  // mongoose invalid object id
  else if (error instanceof mongoose.Error.CastError) {
    statusCode = 400;
    message = "Invalid resource id";
  }
  // duplicate key
  else if (error.code === 11000) {
    statusCode = 400;
    message = "Duplicate field value";
  }
  // generic
  else if (error instanceof Error) {
    message = error.message;
  }

  // structured log — includes request context, not just the raw error
  const logPayload = {
    err: error,
    statusCode,
    method: req.method,
    url: req.originalUrl,
    userId: (req as any).user?.id, // if you attach user via auth middleware
    reqId: (req as any).id, // set by pino-http, see app.ts below
  };

  if (statusCode >= 500) {
    logger.error(logPayload, message);
  } else {
    // 4xx are client errors — real, but not "system is broken" severity
    logger.warn(logPayload, message);
  }
  logger.error(logPayload, message);

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
  });
};

export default errorHandler;
