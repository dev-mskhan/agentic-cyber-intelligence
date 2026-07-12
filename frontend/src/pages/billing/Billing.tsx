import React, { useState } from "react";
import { useGetCurrentSessionQuery } from "../../api/authApi";
import {
  useGetSubscriptionQuery,
  useCreateCheckoutMutation,
  useCreatePortalMutation,
  useGetPlansQuery,
} from "../../api/subscriptionApi";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";
import { CreditCard, Check, ExternalLink } from "lucide-react";
import type { PlanTier } from "../../types/api.types";
import { PLAN_DISPLAY, formatPrice, formatPeriod } from "./planDisplay";

export const Billing: React.FC = () => {
  const { showToast } = useToast();
    const { data: session } = useGetCurrentSessionQuery();
    const { data: subscription, isLoading: isSubscriptionLoading } = useGetSubscriptionQuery();
    const { data: plans, isLoading: isPlansLoading } = useGetPlansQuery();
    const [createCheckout, { isLoading: isCheckingOut }] = useCreateCheckoutMutation();
    const [createPortal, { isLoading: isOpeningPortal }] = useCreatePortalMutation();
    const [loadingTier, setLoadingTier] = useState<PlanTier | null>(null);

    const activeTier = subscription?.planTier || "free";

    const handleCheckout = async (tier: Exclude<PlanTier, "free">) => {
      setLoadingTier(tier);
      try {
        const response = await createCheckout({ planTier: tier }).unwrap();
        showToast("success", "Constructing Stripe checkout node...");
        if (response.checkoutUrl) {
          window.location.href = response.checkoutUrl;
        }
      } catch {
        showToast("error", "Failed to initiate Stripe gateway checkout.");
        setLoadingTier(null);
      }
    };


  const handleOpenPortal = async () => {
    try {
      const response = await createPortal().unwrap();
      showToast("success", "Accessing payment gateways portal...");
      if (response.portalUrl) {
        window.location.href = response.portalUrl;
      }
    } catch {
      showToast("error", "Failed to load Stripe billing portal.");
    }
  };

  if (isSubscriptionLoading || isPlansLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-sm text-brand-muted">
        Syncing subscription parameters...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border pb-5">
        <div>
          <h2 className="text-xl font-bold font-display tracking-tight text-brand-primary">
            SaaS Billing & Subscriptions
          </h2>
          <p className="text-sm text-brand-muted mt-0.5">
            Upgrade your intelligence capabilities, expand team access, and sync live webhooks.
          </p>
        </div>

        {activeTier !== "free" && (
          <Button variant="secondary" size="sm" onClick={handleOpenPortal} isLoading={isOpeningPortal}>
            <CreditCard className="h-4 w-4 mr-1.5" /> Manage Stripe Billing
          </Button>
        )}
      </div>

      {/* Current usage strip */}
      {subscription && (
        <div className="flex items-center gap-2 text-xs text-brand-muted">
          <span>
            {subscription.runsUsed} / {subscription.runsIncluded} runs used this period
          </span>
        </div>
      )}

      {/* PLAN CARDS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {plans?.map((plan) => {
          const meta = PLAN_DISPLAY[plan.tier];
          const isCurrent = activeTier === plan.tier;
          const isFree = plan.tier === "free";

          return (
            <div
              key={plan.tier}
              className={`bg-white border rounded-2xl p-6 flex flex-col justify-between transition-all ${
                isCurrent
                  ? "border-slate-950 ring-2 ring-slate-950/5 shadow-lg"
                  : "border-brand-border hover:border-slate-300"
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-4">
                  <div className="flex items-center gap-2">
                    {meta.icon}
                    <h3 className="text-sm font-bold text-brand-primary font-display uppercase tracking-wide">
                      {meta.name}
                    </h3>
                  </div>
                  {isCurrent && (
                    <span className="text-[9px] font-bold uppercase tracking-wider bg-slate-900 border border-slate-950 text-white px-2 py-0.5 rounded-full">
                      Current Plan
                    </span>
                  )}
                </div>

                <div className="flex items-baseline gap-1.5 border-b border-slate-100 pb-4 mb-4">
                  <span className="text-3xl font-extrabold font-display text-brand-primary">
                    {isFree ? "$0" : formatPrice(plan.price)}
                  </span>
                  <span className="text-xs text-brand-muted font-semibold">
                    / {isFree ? "forever" : formatPeriod(plan.durationInMonths)}
                  </span>
                </div>

                <p className="text-xs text-brand-secondary leading-relaxed mb-6">{meta.desc}</p>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-widest mb-1">
                    Features Included
                  </p>
                  <p className="text-xs text-brand-secondary flex items-start gap-2.5">
                    <Check className="h-4 w-4 shrink-0 text-slate-900 mt-0.5 stroke-[3]" />
                    <span>{plan.runs.toLocaleString()} scan runs included</span>
                  </p>
                  {meta.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-brand-secondary">
                      <Check className="h-4 w-4 shrink-0 text-slate-900 mt-0.5 stroke-[3]" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-8">
                {isCurrent ? (
                  <Button variant="secondary" className="w-full" disabled>
                    Active tier
                  </Button>
                ) : isFree ? (
                  <Button variant="secondary" className="w-full" disabled>
                    Downgrades unavailable
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={() => handleCheckout(plan.tier as Exclude<PlanTier, "free">)}
                    isLoading={isCheckingOut && loadingTier === plan.tier}
                  >
                    Upgrade Tier <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
