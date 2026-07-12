import { z } from "zod";

export const techItemSchema = z.object({
  product: z.string().min(1, "Product name is required"),
  version: z.string().min(1, "Version is required"),
  purpose: z.string().min(3, "Please describe the business purpose of this software"),
  environment: z.enum(["production", "test"]),
  criticality: z.enum(["low", "medium", "high", "critical"]),
});
