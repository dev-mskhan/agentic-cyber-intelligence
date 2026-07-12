import { z } from "zod";
import {
  COMPLIANCE_FRAMEWORKS,
  COMPANY_SIZES,
  INDUSTRIES,
} from "../constants/organization.constants.js";

export const onboardingStep1Schema = z.object({
  body: z.object({
    industry: z
      .string()
      .trim()
      .toLowerCase()
      .refine(
        (val) => INDUSTRIES.includes(val as any),
        `Must be one of: ${INDUSTRIES.join(", ")}`,
      ),
    companySize: z
      .string()
      .trim()
      .toLowerCase()
      .refine(
        (val) => COMPANY_SIZES.includes(val as any),
        `Must be one of: ${COMPANY_SIZES.join(", ")}`,
      ),
    complianceFrameworks: z
      .array(
        z
          .string()
          .trim()
          .toUpperCase()
          .refine(
            (val) => COMPLIANCE_FRAMEWORKS.includes(val as any),
            `Must be one of: ${COMPLIANCE_FRAMEWORKS.join(", ")}`,
          ),
      )
      .min(1, "At least one compliance framework is required"),
  }),
});

export const onboardingStep3Schema = z.object({
  body: z.object({
    reportFrequency: z
      .string()
      .trim()
      .toLowerCase()
      .refine(
        (val) => ["daily", "weekly"].includes(val),
        "Must be one of: daily, weekly",
      ),
    minSeverity: z
      .string()
      .trim()
      .toLowerCase()
      .refine(
        (val) => ["all", "medium", "high"].includes(val),
        "Must be one of: all, medium, high",
      )
  }),
});
export const deleteOrganizationSchema = z.object({
  body: z.object({
    confirmName: z.string().min(1, "You must type the organization name to confirm deletion"),
  }),
});

export type DeleteOrganizationInput = z.infer<typeof deleteOrganizationSchema>;
export type OnboardingStep1Input = z.infer<typeof onboardingStep1Schema>;
export type OnboardingStep3Input = z.infer<typeof onboardingStep3Schema>;
