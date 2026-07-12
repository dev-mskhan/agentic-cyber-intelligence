import { z } from "zod";

export const step1Schema = z.object({
  industry: z.enum([
    "healthcare",
    "financial_services",
    "manufacturing",
    "retail",
    "technology",
    "government",
    "other",
  ], {
    message: "Please select an industry sector",
  }),
  companySize: z.enum([
    "1-10",
    "11-50",
    "51-200",
    "201-1000",
    "1000+",
  ], {
    message: "Please select your company size",
  }),
  complianceFrameworks: z
    .array(
      z.enum(["PCI_DSS", "HIPAA", "SOC2", "ISO27001", "GDPR", "NONE"])
    )
    .min(1, "Please select at least one choice (or NONE)"),
});

export const step3Schema = z.object({
  reportFrequency: z.enum(["daily", "weekly"]),
  minSeverity: z.enum(["all", "medium", "high"])
});
