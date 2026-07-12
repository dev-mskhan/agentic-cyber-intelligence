import React, { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { useVerifyEmailQuery } from "../../api/authApi";
import { ShieldCheck, ShieldAlert, ArrowRight } from "lucide-react";

export const VerifyEmail: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const { data, isLoading, isError } = useVerifyEmailQuery(token || "", {
    skip: !token,
  });

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-md border border-brand-border rounded-xl sm:px-10 text-center space-y-6">
          {isLoading && (
            <div className="space-y-4">
              <div className="relative mx-auto flex h-12 w-12 items-center justify-center">
                <div className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-slate-900 opacity-20"></div>
                <div className="relative rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary animate-spin"></div>
              </div>
              <h3 className="text-lg font-bold text-brand-primary font-display">Verifying Token</h3>
              <p className="text-sm text-brand-muted">
                Connecting to corporate keyservers. Verifying electronic signature...
              </p>
            </div>
          )}

          {!isLoading && isError && (
            <div className="space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-100">
                <ShieldAlert className="h-6 w-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-brand-primary font-display">Verification Failed</h3>
              <p className="text-sm text-brand-muted">
                The verification token is invalid, expired, or has already been used to decrypt profile keys.
              </p>
              <div className="pt-2">
                <Link
                  to="/login"
                  className="w-full inline-flex justify-center items-center gap-2 py-2 px-4 border border-brand-border rounded-lg text-sm font-semibold text-brand-secondary hover:bg-slate-50 transition-colors"
                >
                  Return to Login
                </Link>
              </div>
            </div>
          )}

          {!isLoading && !isError && (
            <div className="space-y-4">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
                <ShieldCheck className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-brand-primary font-display">Identity Verified</h3>
              <p className="text-sm text-brand-muted">
                Your email has been successfully authorized and your organizational is secure.
              </p>
              <div className="pt-2">
                <Link
                  to="/onboarding"
                  className="w-full inline-flex justify-center items-center gap-2 py-2 px-4 bg-brand-primary hover:bg-slate-800 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
                >
                  Continue to Onboarding <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
