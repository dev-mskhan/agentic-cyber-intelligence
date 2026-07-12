import { type ZodSchema, z } from "zod";
import type { Request, Response, NextFunction } from "express";
import ApiError from "../utils/apiError.js";

const validateRequest =
  <T extends ZodSchema>(schema: T) =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse({
      body: req.body,
      params: req.params,
      query: req.query,
    });

    if (!result.success) {
      const message = result.error.issues
        .map((e) => `${e.path.join(".")}: ${e.message}`)
        .join(", ");
      return next(new ApiError(422, message));
    }

    const data = result.data as any;

    if ("body" in data) req.body = data.body;
    if ("params" in data) Object.assign(req.params, data.params);

    // req.query is a getter-only property in Express 5 — can't reassign it,
    // so clear existing keys and copy the validated/transformed values in-place
    if ("query" in data) {
      for (const key of Object.keys(req.query)) {
        delete (req.query as any)[key];
      }
      Object.assign(req.query, data.query);
    }

    next();
  };

export default validateRequest;
