export type UserRole = "admin" | "analyst" | "viewer";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  organizationId: string;
}

export type Industry = "healthcare" | "financial_services" | "manufacturing" | "retail" | "technology" | "government" | "other";
export type CompanySize = "1-10" | "11-50" | "51-200" | "201-1000" | "1000+";
export type ComplianceFramework = "PCI_DSS" | "HIPAA" | "SOC2" | "ISO27001" | "GDPR" | "NONE";

export interface Organization {
  id: string;
  name: string;
  industry: Industry;
  companySize: CompanySize;
  complianceFrameworks: ComplianceFramework[];
  reportFrequency: "daily" | "weekly";
  minSeverity: "all" | "medium" | "high";
  notifyEmails: string[];
  isOnboarded: boolean;
  onboardingStep: number;
}

export type TechEnvironment = "production" | "test";
export type CriticalityLevel = "low" | "medium" | "high" | "critical";

export interface TechItem {
  id: string;
  product: string;
  version: string;
  purpose: string;
  environment: TechEnvironment;
  criticality: CriticalityLevel;
  createdAt: string;
}

export type PlanTier = "free" | "starter" | "pro" | "enterprise";
export type SubscriptionStatus = "active" | "trialing" | "past_due" | "canceled" | "incomplete" | "incomplete_expired" | "unpaid";

export interface Subscription {
  planTier: PlanTier;
  status: SubscriptionStatus;
  runsUsed: number;
  runsIncluded: number;
  renewsAt: string;
}

export type RunStatus = "queued" | "running" | "completed" | "failed" | "cancelled";
export type RunStage = "threat_intelligence" | "vulnerability_research" | "incident_response" | "report_writing";

export interface Run {
  id: string;
  createdAt: string;
  status: RunStatus;
  currentStage: RunStage | null;
  logs: string[];
  reportId?: string;
  completedAt?: string;
}

export interface Threat {
  title: string;
  description: string;
  source: string;
  targetProduct: string;
}

export interface Vulnerability {
  cveId: string;
  description: string;
  cvssScore: number;
  severity: "low" | "medium" | "high" | "critical";
  isKnownExploited: boolean;
  kevDueDate?: string;
  patchVersion?: string;
}

export interface Mitigation {
  id: string;
  title: string;
  priority: "low" | "medium" | "high" | "urgent";
  actionType: "patch" | "configuration" | "network" | "monitoring";
  recommendation: string;
  isCompleted: boolean;
}

export interface ReportSummary {
  id: string;
  runId: string;
  createdAt: string;
  title: string;
  executiveSummary: string;
  riskLevel: "low" | "medium" | "high" | "critical";
  keyFindings: string[];
}

export interface ReportDetail {
  report: ReportSummary;
  threats: Threat[];
  vulnerabilities: Vulnerability[];
  mitigations: Mitigation[];
}
