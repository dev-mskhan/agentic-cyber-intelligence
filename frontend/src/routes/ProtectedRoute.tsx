import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useGetCurrentSessionQuery } from "../api/authApi";
import { useToast } from "../components/ui/Toast";

interface ProtectedRouteProps {
  children: React.ReactElement;
  allowedRoles?: Array<"admin" | "analyst" | "viewer">;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { data: session, isLoading, error } = useGetCurrentSessionQuery();
  const location = useLocation();
  const { showToast } = useToast();
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-brand-bg">
        <div className="relative flex items-center justify-center">
          <div className="animate-ping absolute inline-flex h-12 w-12 rounded-full bg-slate-900 opacity-20"></div>
          <div className="relative rounded-full h-8 w-8 border-t-2 border-b-2 border-brand-primary animate-spin"></div>
        </div>
        <p className="mt-4 text-xs font-mono text-brand-secondary tracking-widest uppercase">
          Verifying security keys...
        </p>
      </div>
    );
  }

  if (error || !session || !session.data) {
    // Clear credentials in application and redirect to login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const { user, org: organization } = session.data;

  // Enforce onboarding check (except if they are on onboarding page itself)
  if (!organization?.isOnboarded && !location.pathname.startsWith("/onboarding")) {
    return <Navigate to="/onboarding" replace />;
  }

  // Role Gate Enforcer
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Show security access violation toast
    setTimeout(() => {
      showToast("error", "Access Denied: You do not have permissions to view that page.");
    }, 100);
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
