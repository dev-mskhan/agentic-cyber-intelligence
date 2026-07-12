import React from "react";
import { Routes, Route, Navigate, BrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { AppShell } from "../components/layout/AppShell";
import { useGetCurrentSessionQuery } from "../api/authApi";
import { useSocketConnectionManager } from "../hooks/useSocketConnectionManager";
import { useEffect } from "react";
import { BrowserRouter as Router } from "react-router-dom";
import { SocketProvider } from "../context/SocketContext";
import { useLocation } from "react-router-dom";
// Pages lazy load equivalents (standard imports)
import { Login } from "../pages/auth/Login";
import { Signup } from "../pages/auth/Signup";
import { ForgotPassword } from "../pages/auth/ForgotPassword";
import { ResetPassword } from "../pages/auth/ResetPassword";
import { VerifyEmail } from "../pages/auth/VerifyEmail";
import { Onboarding } from "../pages/onboarding/Onboarding";
import { Dashboard } from "../pages/dashboard/Dashboard";
import { Technology } from "../pages/technology/Technology";
import { Runs } from "../pages/runs/Runs";
import { Reports } from "../pages/reports/Reports";
import { ReportDetails } from "../pages/reports/ReportDetails";
import { Team } from "../pages/team/Team";
import { Billing } from "../pages/billing/Billing";
import { Settings } from "../pages/settings/Settings";
import { AcceptInvite } from "../pages/auth/AcceptInvite";
export const AppRouter = () => {
  return (
    <SocketProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </SocketProvider>
  );
};
export const AppRoutes = () => {
  const location = useLocation();
  const pendingToken = (location.state as { pendingToken?: string } | null)?.pendingToken;
  useSocketConnectionManager(pendingToken);

  return (
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />
          <Route path="/accept-invite/:token" element={<AcceptInvite />} />
          {/* Onboarding Flow (Authenticated but not necessarily fully onboarded yet) */}
          <Route
            path="/onboarding"
            element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          }
        />

        {/* Internal Shell Routes (ProtectedRoute + Role Gating) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AppShell>
                <Dashboard />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/technology"
          element={
            <ProtectedRoute>
              <AppShell>
                <Technology />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/runs"
          element={
            <ProtectedRoute>
              <AppShell>
                <Runs />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <AppShell>
                <Reports />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports/:id"
          element={
            <ProtectedRoute>
              <AppShell>
                <ReportDetails />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/team"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AppShell>
                <Team />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/billing"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AppShell>
                <Billing />
              </AppShell>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <AppShell>
                <Settings />
              </AppShell>
            </ProtectedRoute>
          }
        />

        {/* Catch-all redirect to Dashboard */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
  );
};
