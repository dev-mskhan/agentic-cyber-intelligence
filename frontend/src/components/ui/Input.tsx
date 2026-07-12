import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = "", id, ...props }, ref) => {
    const inputId = id || React.useId();
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-semibold text-brand-secondary mb-1.5 uppercase tracking-wider">
            {label}
          </label>
        )}
        <input
          id={inputId}
          ref={ref}
          className={`w-full px-3 py-2 text-sm bg-white border rounded-lg shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent ${
            error ? "border-red-500 focus:ring-red-500" : "border-brand-border"
          } ${className}`}
          {...props}
        />
        {error && (
          <p className="mt-1 text-xs text-red-600 font-medium">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
