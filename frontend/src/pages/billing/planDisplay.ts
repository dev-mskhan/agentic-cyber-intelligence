import React from "react";
import { Building2, Shield, Zap, Sparkles } from "lucide-react";
import type { PlanTier } from "../../types/api.types";

export interface PlanDisplayMeta {
  name: string;
  desc: string;
  features: string[];
  icon: React.ReactNode;
}

export const PLAN_DISPLAY: Record<PlanTier, PlanDisplayMeta> = {
  free: {
    name: "Standard Sandbox",
    desc: "For developer sandboxes and basic CVE audit tasks.",
    features: [
      "10 Active inventory items limit",
      "Manual on-demand runs limit (5/month)",
      "Raw matched CVE reporting",
      "1 Administrator node seat",
    ],
    icon: React.createElement(Building2, { className: "h-5 w-5 text-slate-500" }),
  },
  starter: {
    name: "Sovereign Recon",
    desc: "For growing teams that need scheduled scans beyond the sandbox tier.",
    features: [
      "Unlimited technology inventories",
      "Weekly automated LangGraph scans",
      "Raw + correlated CVE reporting",
      "3 Team member seats",
    ],
    icon: React.createElement(Shield, { className: "h-5 w-5 text-emerald-500" }),
  },
  pro: {
    name: "Sovereign Analyst",
    desc: "For small-to-medium business networks needing automated alert systems.",
    features: [
      "Unlimited technology inventories",
      "Daily automated LangGraph scans",
      "CISA KEV exploit correlation mapping",
      "10 Team member seats",
      "Email & slack alert webhooks",
    ],
    icon: React.createElement(Zap, { className: "h-5 w-5 text-amber-500 fill-amber-500" }),
  },
  enterprise: {
    name: "Sovereign Shield",
    desc: "For full threat intelligence, Red-Team compliance, and 24/7 mitigations tracker sync.",
    features: [
      "Unlimited active inventories & nodes",
      "Continuous 24/7 exploit scans",
      "Deep Gemini intelligence analysis",
      "Interactive patching status tracker",
      "SLA guaranteed dedicated engineering Support",
    ],
    icon: React.createElement(Sparkles, { className: "h-5 w-5 text-sky-500 fill-sky-500" }),
  },
};

// Formats the raw numeric duration/price coming from the backend into
// the "$299 / month" style labels the card UI expects.
export function formatPrice(price: number): string {
  return `$${price}`;
}

export function formatPeriod(durationInMonths: number): string {
  if (durationInMonths <= 1) return "month";
  if (durationInMonths === 12) return "year";
  return `${durationInMonths} months`;
}
