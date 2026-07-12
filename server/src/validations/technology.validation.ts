import { z } from "zod";
import {
  ENVIRONMENTS,
  CRITICALITY_LEVELS,
} from "../constants/technology.constants.js";

const technologyRowSchema = z.object({
  product: z.string().min(1, "Product is required").trim(),
  version: z.string().trim().default("unknown"),
  purpose: z.string().min(1, "Purpose is required").trim(),
  environment: z.enum(ENVIRONMENTS),
  criticality: z.enum(CRITICALITY_LEVELS),
  catalogRef: z.string().optional(),
});

export const createTechnologySchema = z.object({
  body: technologyRowSchema,
});

export const bulkCreateTechnologySchema = z.object({
  body: z.object({
    rows: z.array(technologyRowSchema).min(1, "At least one row is required"),
  }),
});

export const catalogSearchSchema = z.object({
  query: z.object({
    q: z.string().min(1, "Search query is required"),
  }),
});

export type CreateTechnologyInput = z.infer<typeof createTechnologySchema>;
export type BulkCreateTechnologyInput = z.infer<
  typeof bulkCreateTechnologySchema
>;
