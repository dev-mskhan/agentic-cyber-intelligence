import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useSocketEvent } from "../../hooks/useSocket";
import { useLazyGetVerificationStatusQuery } from "../../api/authApi";
import { Button } from "../ui/Button";
import { Shield, MailCheck, AlertCircle, Loader2 } from "lucide-react";
import { EVENTS } from "../../constants/socketEvents";

interface EmailVerificationPendingProps {
  email: string;
  pendingToken: string;
}

type Status = "sent" | "failed" | "verified" | "checking";

export const EmailVerificationPending: React.FC<EmailVerificationPendingProps> = ({ email, pendingToken }) => {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("sent");

  const [fetchStatus] = useLazyGetVerificationStatusQuery();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const result = await fetchStatus(pendingToken).unwrap();
        if (cancelled) return;
        if (result.emailVerified) {
          setStatus("verified");
          setTimeout(() => navigate("/onboarding"), 1200);
        }
      } catch {
        // reconciliation failing silently is fine — live socket events and
        // the user's own "refresh" action remain available as fallbacks
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [pendingToken]);

  useSocketEvent(EVENTS.EMAIL_VERIFICATION_FAILED, () => {
    setStatus("failed");
  });

  useSocketEvent(EVENTS.EMAIL_VERIFIED, () => {
    setStatus("verified");
    setTimeout(() => navigate("/onboarding"), 1200);
  });

  const handleRefresh = async () => {
    setStatus("checking");
    try {
      const result = await fetchStatus(pendingToken).unwrap();
      if (result.emailVerified) {
        setStatus("verified");
        setTimeout(() => navigate("/onboarding"), 1200);
      } else {
        setStatus("sent");
      }
    } catch {
      setStatus("sent");
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center py-12 px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 text-white shadow-lg mb-4">
          <Shield className="h-6 w-6" />
        </div>
        <h2 className="text-center text-3xl font-extrabold font-display tracking-tight text-brand-primary">
          Verify your email
        </h2>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-md border border-brand-border rounded-xl sm:px-10 text-center">
          {status === "checking" && (
            <>
              <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-slate-100 mb-4">
                <Loader2 className="h-6 w-6 text-slate-500 animate-spin" />
              </div>
              <p className="text-sm text-brand-secondary font-medium">Checking status…</p>
            </>
          )}

          {status === "sent" && (
            <>
              <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 mb-4">
                <MailCheck className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-sm text-brand-primary font-semibold">Check your inbox</p>
              <p className="mt-1.5 text-xs text-brand-muted">
                We sent a verification link to <span className="font-medium text-brand-secondary">{email}</span>.
                Click it to activate your account.
              </p>
              <p className="mt-4 text-[11px] text-brand-muted">
                Didn't get it? Check your spam folder, or{" "}
                <button
                  onClick={handleRefresh}
                  className="font-semibold text-slate-700 hover:text-slate-950 underline underline-offset-4 cursor-pointer"
                >
                  check again
                </button>{" "}
                once you're ready.
              </p>
            </>
          )}

          {status === "failed" && (
            <>
              <div className="mb-5 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-medium flex gap-2 items-start text-left">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                <span>We couldn't send your verification email. Please try again.</span>
              </div>
              <Button variant="primary" className="w-full" onClick={handleRefresh}>
                Retry
              </Button>
            </>
          )}

          {status === "verified" && (
            <>
              <div className="flex h-14 w-14 mx-auto items-center justify-center rounded-full bg-emerald-50 border border-emerald-200 mb-4">
                <MailCheck className="h-6 w-6 text-emerald-600" />
              </div>
              <p className="text-sm text-brand-primary font-semibold">Email verified!</p>
              <p className="mt-1.5 text-xs text-brand-muted">Redirecting you to onboarding…</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
