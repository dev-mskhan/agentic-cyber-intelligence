import React from "react";

type BadgeSeverity = "critical" | "high" | "medium" | "low" | "default";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  severity?: BadgeSeverity;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  severity = "default",
  className = "",
  ...props
}) => {
  const baseClass = "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider";
  
  const styles: Record<BadgeSeverity, string> = {
    critical: "bg-sev-critical-bg text-sev-critical-text border border-rose-200",
    high: "bg-sev-high-bg text-sev-high-text border border-amber-200",
    medium: "bg-sev-medium-bg text-sev-medium-text border border-yellow-200",
    low: "bg-sev-low-bg text-sev-low-text border border-emerald-200",
    default: "bg-slate-100 text-slate-800 border border-slate-200",
  };

  return (
    <span className={`${baseClass} ${styles[severity]} ${className}`} {...props}>
      {children}
    </span>
  );
};
