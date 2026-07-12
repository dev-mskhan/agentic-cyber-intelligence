import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step1Schema, step3Schema } from "../../features/onboarding/schemas";
import { useGetCurrentSessionQuery, useLogoutMutation } from "../../api/authApi";
import {
  useUpdateOnboardingStep1Mutation,
  useUpdateOnboardingStep3Mutation,
  useDeleteOrganizationMutation,
} from "../../api/organizationApi";
import { Card } from "../../components/ui/Card";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";
import { Settings as SettingsIcon, Building2, Bell, AlertOctagon, Trash2 } from "lucide-react";

export const Settings: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: session } = useGetCurrentSessionQuery();
  const [updateProfile, { isLoading: isProfileLoading }] = useUpdateOnboardingStep1Mutation();
  const [updateAlerts, { isLoading: isAlertsLoading }] = useUpdateOnboardingStep3Mutation();
  const [deleteOrganization, { isLoading: isDeleting }] = useDeleteOrganizationMutation();
  const [logout] = useLogoutMutation();

  const [confirmName, setConfirmName] = useState("");
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const org = session?.data.org;
  const user = session?.data.user;
  const isAdmin = user?.role === "admin";
  // Form 1: Company Profile
  const {
    register: regProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
  } = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      industry: (org?.industry || "technology") as any,
      companySize: (org?.companySize || "11-50") as any,
      complianceFrameworks: org?.complianceFrameworks || ["NONE"],
    } as any,
  });

  const onProfileSave = async (data: any) => {
    try {
      await updateProfile(data).unwrap();
      showToast("success", "Organization profile parameters saved.");
    } catch {
      showToast("error", "Failed to update profile parameters.");
    }
  };

  // Form 2: Alert Rules (notifyEmails removed — not shown/collected anymore)
  const {
    register: regAlerts,
    handleSubmit: handleAlertsSubmit,
    formState: { errors: alertErrors },
  } = useForm({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      reportFrequency: (org?.notificationPreferences?.reportFrequency || "weekly") as any,
      minSeverity: (org?.notificationPreferences?.minSeverity || "all") as any,
    },
  });

  const onAlertsSave = async (data: any) => {
    try {
      // notifyEmails intentionally not collected in the UI anymore;
      // if step3Schema still requires it, this payload will need adjusting
      // there too (make it optional / remove it from the schema).
      await updateAlerts(data).unwrap();
      showToast("success", "Notification schedules & criteria saved.");
    } catch {
      showToast("error", "Failed to update notifications configuration.");
    }
  };

  const handleDeleteOrganization = async () => {
    if (!isAdmin || !org) return;
    if (confirmName !== org.name) {
      showToast("error", "Confirmation name mismatch. Type organization name exactly.");
      return;
    }

    try {
      await deleteOrganization({ confirmName }).unwrap();
      await logout().unwrap();
      showToast("success", "Organization workspace permanently deleted.");
      navigate("/login");
    } catch {
      showToast("error", "Decommissioning process failed.");
    }
  };

  const industries = [
    { label: "Technology", value: "technology" },
    { label: "Healthcare", value: "healthcare" },
    { label: "Financial Services", value: "financial_services" },
    { label: "Manufacturing", value: "manufacturing" },
    { label: "Retail & Commerce", value: "retail" },
    { label: "Government", value: "government" },
    { label: "Other Sectors", value: "other" },
  ];

  const companySizes = ["1-10", "11-50", "51-200", "201-1000", "1000+"];

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="border-b border-brand-border pb-5">
        <h2 className="text-xl font-bold font-display tracking-tight text-brand-primary flex items-center gap-2">
          <SettingsIcon className="h-5 w-5 text-slate-700" /> Platform & Workspace Settings
        </h2>
        <p className="text-sm text-brand-muted mt-0.5">
          Configure security profile properties, alert notification criteria, and administrative controls.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Form 1 Card: Company Profile */}
        <Card title="Organization Profile Details" description="Adjust metadata utilized to score vulnerability risks.">
          <form onSubmit={handleProfileSubmit(onProfileSave)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brand-secondary uppercase tracking-wider mb-1.5">
                Organization Name
              </label>
              <div className="w-full px-3 py-2 text-sm bg-slate-50 border border-brand-border rounded-lg text-brand-primary font-medium flex items-center gap-2">
                <Building2 className="h-4 w-4 text-slate-400" />
                {org?.name || "—"}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-secondary uppercase tracking-wider mb-1.5">
                Industry Sector
              </label>
              <select
                disabled={!isAdmin}
                className="w-full px-3 py-2 text-sm bg-white border border-brand-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-60"
                {...regProfile("industry")}
              >
                {industries.map((ind) => (
                  <option key={ind.value} value={ind.value}>
                    {ind.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-secondary uppercase tracking-wider mb-1.5">
                Company Employee Size
              </label>
              <select
                disabled={!isAdmin}
                className="w-full px-3 py-2 text-sm bg-white border border-brand-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-60"
                {...regProfile("companySize")}
              >
                {companySizes.map((size) => (
                  <option key={size} value={size}>
                    {size} Employees
                  </option>
                ))}
              </select>
            </div>

            {isAdmin && (
              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" size="sm" isLoading={isProfileLoading}>
                  Save Profile
                </Button>
              </div>
            )}
          </form>
        </Card>

        {/* Form 2 Card: Alert Schedules */}
        <Card title="Notifications & Scanning Alerting" description="Adjust active scan schedules and severe vulnerability filters.">
          <form onSubmit={handleAlertsSubmit(onAlertsSave)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brand-secondary uppercase tracking-wider mb-1.5">
                Report Audit Frequency
              </label>
              <select
                disabled={!isAdmin}
                className="w-full px-3 py-2 text-sm bg-white border border-brand-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-60"
                {...regAlerts("reportFrequency")}
              >
                <option value="daily">Daily scan pipeline</option>
                <option value="weekly">Weekly review summary</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-brand-secondary uppercase tracking-wider mb-1.5">
                Minimum Alert severity filter
              </label>
              <select
                disabled={!isAdmin}
                className="w-full px-3 py-2 text-sm bg-white border border-brand-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900 disabled:opacity-60"
                {...regAlerts("minSeverity")}
              >
                <option value="all">Report All (Low & Higher)</option>
                <option value="medium">Medium & Higher Only</option>
                <option value="high">High & Critical Severity Only</option>
              </select>
            </div>

            {isAdmin && (
              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" size="sm" isLoading={isAlertsLoading}>
                  Save Alert Settings
                </Button>
              </div>
            )}
          </form>
        </Card>
      </div>

      {/* DESTRUCTIVE ACTION CONTAINER (Admins only) */}
      {isAdmin && org && (
        <Card
          title="Remove Organization"
          description="Permanently delete this organization workspace, software inventory, and all history logs. This action is irreversible."
          className="border-red-200 bg-red-50/10"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700">
                <AlertOctagon className="h-4 w-4" /> Danger Zone Warning
              </span>
              <p className="text-xs text-brand-secondary">
                Decommissioning will evict all team members and erase all recorded CVE vulnerability mappings.
              </p>
            </div>

            <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
              <Trash2 className="h-4 w-4 mr-1.5" /> Delete Workspace
            </Button>
          </div>
        </Card>
      )}

      {/* DELETE ORGANIZATION CONFIRMATION MODAL */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-brand-border rounded-xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-2.5 text-red-700">
              <AlertOctagon className="h-5 w-5" />
              <h3 className="text-base font-bold font-display tracking-tight">Confirm Decommissioning</h3>
            </div>
            <p className="text-xs text-brand-secondary leading-relaxed">
              You are about to permanently delete <span className="font-bold text-slate-900">{org?.name}</span>. This will destroy all inventories, analysis histories, and active subscription parameters.
            </p>
            <div>
              <p className="text-[10px] font-bold font-mono text-slate-400 uppercase tracking-wide mb-1.5">
                Type the organization name exactly to authorize:
              </p>
              <input
                type="text"
                value={confirmName}
                onChange={(e) => setConfirmName(e.target.value)}
                placeholder={org?.name}
                className="w-full px-3 py-2 text-sm bg-white border border-red-300 rounded-lg shadow-xs focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="secondary" size="sm" onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDeleteOrganization}
                isLoading={isDeleting}
                disabled={confirmName !== org?.name}
              >
                Permanently Destroy
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
