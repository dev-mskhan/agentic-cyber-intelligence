import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  description?: string;
  headerActions?: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({
  children,
  title,
  description,
  headerActions,
  className = "",
  ...props
}) => {
  return (
    <div
      className={`bg-brand-card border border-brand-border rounded-xl shadow-[0_1px_3px_rgba(0,0,0,0.02)] overflow-hidden ${className}`}
      {...props}
    >
      {(title || description || headerActions) && (
        <div className="px-5 py-4 border-b border-brand-border flex items-center justify-between flex-wrap gap-2">
          <div>
            {title && (
              <h3 className="text-base font-semibold text-brand-primary tracking-tight">
                {title}
              </h3>
            )}
            {description && (
              <p className="text-xs text-brand-muted mt-0.5">
                {description}
              </p>
            )}
          </div>
          {headerActions && <div className="flex items-center gap-2">{headerActions}</div>}
        </div>
      )}
      <div className="px-5 py-4">{children}</div>
    </div>
  );
};
