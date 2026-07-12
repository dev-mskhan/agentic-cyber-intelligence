export const THREAT_SEVERITY_LEVELS = [
  "low",
  "medium",
  "high",
  "critical",
] as const;

// broad categorization surfaced by the Threat Intelligence Analyst node
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
