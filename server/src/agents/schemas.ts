import { z } from "zod";

export const THREAT_CATEGORIES = [
  "malware",
  "phishing",
  "ransomware",
  "supply_chain",
  "insider_threat",
  "ddos",
  "data_breach",
  "zero_day",
  "other",
] as const;

// Loose schema — this is what actually goes to the LLM as the tool's parameter schema.
// A free-text string here means Groq can never reject the tool call for an "invalid" category.
export const threatOutputSchema = z.object({
  threats: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      category: z.string(), // loosened from z.enum(...)
      severity: z.enum(["low", "medium", "high", "critical"]),
      sourceName: z.string(),
      sourceUrl: z.string(),
      publishedAt: z.string(),
    })
  ),
});

// Strict schema — used only in your own code, never passed to the LLM.
export const threatSchemaStrict = z.object({
  title: z.string(),
  description: z.string(),
  category: z.enum(THREAT_CATEGORIES),
  severity: z.enum(["low", "medium", "high", "critical"]),
  sourceName: z.string(),
  sourceUrl: z.string(),
  publishedAt: z.string(),
});

export const mitigationOutputSchema = z.object({
  mitigations: z.array(
    z.object({
      vulnerabilityCveId: z.string(), // matched back to a vulnerability by cveId within the run
      title: z.string().min(1),
      recommendation: z.string().min(1),
      actionType: z.enum([
        "patch",
        "configuration_change",
        "access_control",
        "monitoring",
        "network_segmentation",
        "policy",
        "other",
      ]),
      priority: z.enum(["low", "medium", "high", "urgent"]),
      estimatedEffort: z.string().optional(),
    }),
  ),
});

export const reportOutputSchema = z.object({
  executiveSummary: z.string().min(1),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
  reportBody: z.string().min(1),
  complianceNotes: z.string().optional(),
});
export const vulnerabilityOutputSchema = z.object({
  vulnerabilities: z.array(
    z.object({
      technologyInventoryId: z.string(),
      cveId: z.string().regex(/^CVE-\d{4}-\d+$/),
      title: z.string().min(1),
      description: z.string().min(1),
      cvssScore: z.number().min(0).max(10).optional(),
      severity: z.enum(["low", "medium", "high", "critical"]),
      isKnownExploited: z.boolean(),
      kevDueDate: z.string().optional(),
      cpeMatched: z.string(),
      publishedAt: z.string().optional(),
    }),
  ),
});
export type ThreatOutput = z.infer<typeof threatOutputSchema>;
export type VulnerabilityOutput = z.infer<typeof vulnerabilityOutputSchema>;
export type MitigationOutput = z.infer<typeof mitigationOutputSchema>;
export type ReportOutput = z.infer<typeof reportOutputSchema>;
