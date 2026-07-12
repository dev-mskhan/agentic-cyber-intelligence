import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { step1Schema, step3Schema } from "../../features/onboarding/schemas";
import type { ComplianceFramework } from "../../types/api.types";
import { useGetCurrentSessionQuery } from "../../api/authApi";
import {
  useUpdateOnboardingStep1Mutation,
  useUpdateOnboardingStep3Mutation,
} from "../../api/organizationApi";
import {
  useGetTechnologyQuery,
  useBulkAddTechnologyMutation,
  useDeleteTechnologyMutation,
  useLazySearchCatalogQuery,
} from "../../api/technologyApi";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { useToast } from "../../components/ui/Toast";
import {
  Building2,
  Cpu,
  Mail,
  Plus,
  Trash2,
  FileSpreadsheet,
  Check,
  Search,
  CheckSquare,
  Square,
} from "lucide-react";

interface PendingTechRow {
  clientId: string;
  product: string;
  version: string;
  purpose: string;
  environment: "production" | "test";
  criticality: "low" | "medium" | "high" | "critical";
}

export const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { data: session, refetch: refetchSession } = useGetCurrentSessionQuery();

  const [updateStep1, { isLoading: isStep1Loading }] = useUpdateOnboardingStep1Mutation();
  const [updateStep3, { isLoading: isStep3Loading }] = useUpdateOnboardingStep3Mutation();

  const { data: techInventory = [] } = useGetTechnologyQuery();
  const [bulkAddTech, { isLoading: isBulkLoading }] = useBulkAddTechnologyMutation();
  const [deleteTech] = useDeleteTechnologyMutation();

  const [step, setStep] = useState(1);

  // Autocomplete state
  const [searchQuery, setSearchQuery] = useState("");
  const [catalogQuery, { data: catalogMatches = [] }] = useLazySearchCatalogQuery();
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  // New item form
  const [newProduct, setNewProduct] = useState("");
  const [newVersion, setNewVersion] = useState("");
  const [newPurpose, setNewPurpose] = useState("");
  const [newEnv, setNewEnv] = useState<"production" | "test">("production");
  const [newCriticality, setNewCriticality] = useState<"low" | "medium" | "high" | "critical">("medium");

  // Bulk paste state
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [csvContent, setCsvContent] = useState("");

  // Locally accumulated rows, not yet persisted to the server. Each item
  // is a stable client-side id (not a server _id) so React keys and
  // per-row local deletion work before anything has been saved.
  const [pendingRows, setPendingRows] = useState<PendingTechRow[]>([]);

  const org = session?.organization;

  // Sync step with actual organization progress
  useEffect(() => {
    if (org) {
      if (org.isOnboarded) {
        navigate("/dashboard");
      } else if (org.onboardingStep) {
        setStep(org.onboardingStep);
      }
    }
  }, [org, navigate]);

  // Step 1: Company Profile Form
  const {
    register: reg1,
    handleSubmit: handleSub1,
    setValue: setVal1,
    watch: watch1,
    formState: { errors: errs1 },
  } = useForm({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      industry: "technology" as const,
      companySize: "11-50" as const,
      complianceFrameworks: [] as ComplianceFramework[],
    },
  });

  const selectedFrameworks = (watch1("complianceFrameworks") || []) as ComplianceFramework[];

  const toggleFramework = (fw: ComplianceFramework) => {
    let updated = [...selectedFrameworks] as ComplianceFramework[];
    if (fw === "NONE") {
      updated = ["NONE" as ComplianceFramework];
    } else {
      updated = updated.filter((item) => item !== "NONE");
      if (updated.includes(fw)) {
        updated = updated.filter((item) => item !== fw);
      } else {
        updated.push(fw);
      }
    }
    if (updated.length === 0) {
      updated = ["NONE" as ComplianceFramework];
    }
    setVal1("complianceFrameworks", updated);
  };

  const onStep1Submit = async (data: any) => {
    try {
      await updateStep1(data).unwrap();
      showToast("success", "Company profile saved.");
      setStep(2);
    } catch {
      showToast("error", "Failed to update company profile");
    }
  };

  // Autocomplete debounce searching
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 1) {
        catalogQuery(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery, catalogQuery]);

  const selectCatalogProduct = (product: string) => {
    setNewProduct(product);
    setSearchQuery(product);
    setShowAutocomplete(false);
  };

  // Adds to LOCAL state only — no network call. Persisted in one batch
  // when the user clicks "Save & Continue" on this step.
  const handleAddTechItem = () => {
    if (!newProduct || !newVersion || !newPurpose) {
      showToast("error", "Please provide product, version, and purpose.");
      return;
    }

    setPendingRows((prev) => [
      ...prev,
      {
        clientId: crypto.randomUUID(),
        product: newProduct,
        version: newVersion,
        purpose: newPurpose,
        environment: newEnv,
        criticality: newCriticality,
      },
    ]);

    showToast("success", `${newProduct} added — saved when you continue.`);

    setNewProduct("");
    setSearchQuery("");
    setNewVersion("");
    setNewPurpose("");
  };

  // Parses pasted CSV into LOCAL state only — no network call.
  const handleBulkCsvParse = () => {
    if (!csvContent.trim()) {
      showToast("error", "Bulk input cannot be empty.");
      return;
    }

    const lines = csvContent.split("\n");
    const rows: PendingTechRow[] = [];
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length >= 2) {
        rows.push({
          clientId: crypto.randomUUID(),
          product: parts[0],
          version: parts[1],
          purpose: parts[2] || "Bulk imported system",
          environment: (parts[3] as "production" | "test") || "production",
          criticality: (parts[4] as PendingTechRow["criticality"]) || "medium",
        });
      }
    }

    if (rows.length === 0) {
      showToast("error", "No valid entries detected. Ensure comma-separated formatting (Product, Version).");
      return;
    }

    setPendingRows((prev) => [...prev, ...rows]);
    showToast("success", `${rows.length} systems added — saved when you continue.`);
    setCsvContent("");
    setIsBulkMode(false);
  };

  const handleRemovePendingRow = (clientId: string) => {
    setPendingRows((prev) => prev.filter((r) => r.clientId !== clientId));
  };

  const handleDeleteSavedRow = async (id: string) => {
    try {
      await deleteTech(id).unwrap();
    } catch {
      showToast("error", "Failed to remove item.");
    }
  };

  const handleStep2Next = async () => {
    const totalCount = techInventory.length + pendingRows.length;
    if (totalCount === 0) {
      showToast("info", "Please declare at least one technology stack asset to analyze.");
      return;
    }

    if (pendingRows.length === 0) {
      setStep(3);
      return;
    }

    try {
      await bulkAddTech({
        rows: pendingRows.map(({ clientId, ...row }) => row),
      }).unwrap();

      showToast("success", `Saved ${pendingRows.length} system${pendingRows.length > 1 ? "s" : ""} to your technology stack.`);
      setPendingRows([]);
      setStep(3);
    } catch {
      showToast("error", "Failed to save technology stack. Please try again.");
    }
  };

  // Step 3: Notification Prefs Form
  // notifyEmails is no longer collected here — the admin is auto-subscribed
  // at signup, and recipients are managed later from Team Settings.
  const {
    register: reg3,
    handleSubmit: handleSub3,
    formState: { errors: errs3 },
  } = useForm({
    resolver: zodResolver(step3Schema),
    defaultValues: {
      reportFrequency: "weekly" as const,
      minSeverity: "all" as const,
    },
  });

  const onStep3Submit = async (data: any) => {
    try {
      await updateStep3(data).unwrap();
      await refetchSession();
      showToast("success", "Account and notifications finalized!");
      navigate("/dashboard");
    } catch {
      showToast("error", "Failed to finalize onboarding parameters.");
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
  const frameworks: ComplianceFramework[] = ["PCI_DSS", "HIPAA", "SOC2", "ISO27001", "GDPR", "NONE"];

  return (
    <div className="min-h-screen bg-brand-bg py-10 px-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Onboarding Header */}
        <div className="text-center">
          <h1 className="text-2xl font-bold font-display text-brand-primary">
            Initialize Security Workspace
          </h1>
          <p className="text-sm text-brand-muted mt-1.5">
            Let's configure your profile to start scanning for vulnerabilities & active threats.
          </p>
        </div>

        {/* Wizard Multi-Step Progress Tracker */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center" aria-hidden="true">
            <div className="w-full border-t border-brand-border" />
          </div>
          <div className="relative flex justify-between">
            {[
              { num: 1, label: "Profile", icon: <Building2 className="h-4 w-4" /> },
              { num: 2, label: "Tech Stack", icon: <Cpu className="h-4 w-4" /> },
              { num: 3, label: "Alerting", icon: <Mail className="h-4 w-4" /> },
            ].map((s) => {
              const isCurrent = step === s.num;
              const isCompleted = step > s.num;
              return (
                <div key={s.num} className="flex flex-col items-center">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold shadow-xs transition-all duration-300 z-10 ${
                      isCompleted
                        ? "bg-slate-900 border-slate-950 text-white"
                        : isCurrent
                        ? "bg-white border-slate-900 text-slate-950 ring-2 ring-slate-900/10"
                        : "bg-white border-brand-border text-brand-muted"
                    }`}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : s.num}
                  </span>
                  <span
                    className={`mt-2 text-xs font-semibold tracking-wide uppercase ${
                      isCurrent || isCompleted ? "text-slate-900" : "text-brand-muted"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* STEP 1: COMPANY PROFILE */}
        {step === 1 && (
          <Card title="Company Security Profile" description="Establish company metadata to tailor vulnerability risk weighting.">
            <form onSubmit={handleSub1(onStep1Submit)} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-brand-secondary uppercase tracking-wider mb-1.5">
                    Industry Sector
                  </label>
                  <select
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    {...reg1("industry")}
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
                    Company Size (Employees)
                  </label>
                  <select
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    {...reg1("companySize")}
                  >
                    {companySizes.map((size) => (
                      <option key={size} value={size}>
                        {size} Employee Nodes
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Compliance Framework Checkboxes */}
              <div>
                <label className="block text-xs font-semibold text-brand-secondary uppercase tracking-wider mb-3">
                  Regulatory Compliance Audits
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {frameworks.map((fw) => {
                    const checked = selectedFrameworks.includes(fw);
                    return (
                      <button
                        type="button"
                        key={fw}
                        onClick={() => toggleFramework(fw)}
                        className={`flex items-center gap-2.5 p-3 text-xs font-semibold rounded-lg border text-left transition-all duration-150 cursor-pointer ${
                          checked
                            ? "bg-slate-950 border-slate-950 text-white"
                            : "bg-white border-brand-border text-brand-secondary hover:bg-slate-50"
                        }`}
                      >
                        {checked ? <CheckSquare className="h-4 w-4 shrink-0" /> : <Square className="h-4 w-4 shrink-0" />}
                        <span>{fw === "NONE" ? "No compliance mandate" : fw}</span>
                      </button>
                    );
                  })}
                </div>
                {errs1.complianceFrameworks && (
                  <p className="mt-1.5 text-xs text-red-600 font-medium">{errs1.complianceFrameworks.message}</p>
                )}
              </div>

              <div className="flex justify-end pt-2">
                <Button type="submit" variant="primary" isLoading={isStep1Loading}>
                  Save & Continue
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* STEP 2: TECHNOLOGY INVENTORY */}
        {step === 2 && (
          <div className="space-y-6">
            <Card
              title="Declare Software Inventory"
              description="Define operating products and versions to match against known active exploits and CVE bulletins."
              headerActions={
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => setIsBulkMode(!isBulkMode)}
                  className="flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  <span>{isBulkMode ? "Form Mode" : "Bulk Import Mode"}</span>
                </Button>
              }
            >
              {isBulkMode ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-secondary uppercase tracking-wider mb-1.5">
                      Paste CSV Records (Format: Product, Version, Purpose, Env, Criticality)
                    </label>
                    <textarea
                      rows={6}
                      value={csvContent}
                      onChange={(e) => setCsvContent(e.target.value)}
                      placeholder="e.g.&#10;Nginx, 1.18.0, Web reverse proxy, production, critical&#10;PostgreSQL, 12.5, Transactional database, production, high"
                      className="w-full px-3 py-2 text-xs font-mono bg-white border border-brand-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                  <div className="text-[10px] text-brand-muted leading-relaxed">
                    * Paste multiple entries separated by lines. Product and Version are required. Other parameters default to production / medium if omitted. Rows are added to your list below and saved together when you continue.
                  </div>
                  <div className="flex gap-2 justify-end">
                    <Button variant="secondary" size="sm" onClick={() => setIsBulkMode(false)}>
                      Cancel
                    </Button>
                    <Button variant="primary" size="sm" onClick={handleBulkCsvParse}>
                      Add to List
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Autocomplete Product Search */}
                    <div className="relative">
                      <label className="block text-xs font-semibold text-brand-secondary uppercase tracking-wider mb-1.5">
                        Product Search (Catalog backed)
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setNewProduct(e.target.value);
                            setShowAutocomplete(true);
                          }}
                          placeholder="Search e.g. Nginx, Postgres..."
                          className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-brand-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                        <Search className="absolute left-2.5 top-3 h-4 w-4 text-slate-400" />
                      </div>

                      {showAutocomplete && catalogMatches.length > 0 && (
                        <div className="absolute left-0 right-0 mt-1.5 bg-white border border-brand-border rounded-lg shadow-xl max-h-48 overflow-y-auto z-40">
                          {catalogMatches.map((match) => (
                            <button
                              type="button"
                              key={match}
                              onClick={() => selectCatalogProduct(match)}
                              className="w-full text-left px-3.5 py-2 text-xs text-brand-primary hover:bg-slate-50 border-b border-slate-100 last:border-b-0 cursor-pointer"
                            >
                              {match}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <Input
                      label="Software Version"
                      type="text"
                      placeholder="e.g. 1.18.0 or 12.5"
                      value={newVersion}
                      onChange={(e) => setNewVersion(e.target.value)}
                    />
                  </div>

                  <Input
                    label="Business Purpose"
                    type="text"
                    placeholder="e.g. Gateway API proxying for banking backend"
                    value={newPurpose}
                    onChange={(e) => setNewPurpose(e.target.value)}
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-brand-secondary uppercase tracking-wider mb-1.5">
                        Deployment Environment
                      </label>
                      <select
                        className="w-full px-3 py-2 text-sm bg-white border border-brand-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                        value={newEnv}
                        onChange={(e) => setNewEnv(e.target.value as any)}
                      >
                        <option value="production">Production Cluster</option>
                        <option value="test">Staging / Test</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-brand-secondary uppercase tracking-wider mb-1.5">
                        System Criticality Index
                      </label>
                      <select
                        className="w-full px-3 py-2 text-sm bg-white border border-brand-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                        value={newCriticality}
                        onChange={(e) => setNewCriticality(e.target.value as any)}
                      >
                        <option value="low">Low Exposure</option>
                        <option value="medium">Medium Impact</option>
                        <option value="high">High Asset Value</option>
                        <option value="critical">Critical Core Dependency</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <Button variant="secondary" size="sm" onClick={handleAddTechItem}>
                      <Plus className="h-4 w-4 mr-1.5" /> Declare Asset
                    </Button>
                  </div>
                </div>
              )}
            </Card>

            {/* Current Stack List — persisted rows + this session's pending (unsaved) rows */}
            <Card
              title="Current Technology Stack"
              description={`${techInventory.length + pendingRows.length} system${
                techInventory.length + pendingRows.length === 1 ? "" : "s"
              } declared${pendingRows.length > 0 ? ` · ${pendingRows.length} unsaved` : ""}.`}
            >
              {techInventory.length === 0 && pendingRows.length === 0 ? (
                <div className="text-center py-8 text-xs font-medium text-brand-muted border border-dashed border-brand-border rounded-lg">
                  No technology stack declared yet. Add assets above or import a spreadsheet.
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {/* Already-persisted rows (e.g. user stepped back to step 2 after a prior save) */}
                  {techInventory.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 border border-brand-border rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-brand-primary">{item.product}</span>
                          <span className="text-xs bg-slate-100 text-slate-800 border border-slate-200 px-1.5 py-0.5 rounded font-mono font-medium">
                            v{item.version}
                          </span>
                          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 bg-slate-50 px-1 border rounded">
                            {item.environment}
                          </span>
                        </div>
                        <p className="text-xs text-brand-secondary mt-1">{item.purpose}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge severity={item.criticality}>{item.criticality}</Badge>
                        <button
                          onClick={() => handleDeleteSavedRow(item.id)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-slate-100 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Pending rows — added this session, not yet sent to the server */}
                  {pendingRows.map((item) => (
                    <div
                      key={item.clientId}
                      className="flex items-center justify-between p-3 border border-dashed border-amber-300 bg-amber-50/40 rounded-lg"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-brand-primary">{item.product}</span>
                          <span className="text-xs bg-slate-100 text-slate-800 border border-slate-200 px-1.5 py-0.5 rounded font-mono font-medium">
                            v{item.version}
                          </span>
                          <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 bg-slate-50 px-1 border rounded">
                            {item.environment}
                          </span>
                          <span className="text-[10px] uppercase font-mono tracking-wider text-amber-700 bg-amber-100 px-1.5 py-0.5 border border-amber-200 rounded">
                            unsaved
                          </span>
                        </div>
                        <p className="text-xs text-brand-secondary mt-1">{item.purpose}</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Badge severity={item.criticality}>{item.criticality}</Badge>
                        <button
                          onClick={() => handleRemovePendingRow(item.clientId)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-slate-100 transition-all cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <div className="flex justify-between pt-2">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button variant="primary" onClick={handleStep2Next} isLoading={isBulkLoading}>
                Save & Continue
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: NOTIFICATION PREFERENCES */}
        {step === 3 && (
          <Card title="Alerting & Intel Schedules" description="Configure automated subscription-based reporting schedules and notification thresholds.">
            <form onSubmit={handleSub3(onStep3Submit)} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-brand-secondary uppercase tracking-wider mb-2">
                  Scanning & Reporting Frequency
                </label>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: "daily", label: "Daily scans", desc: "For dynamic cloud infrastructures" },
                    { id: "weekly", label: "Weekly reviews", desc: "For stable, consolidated networks" },
                  ].map((freq) => {
                    return (
                      <label
                        key={freq.id}
                        className="flex flex-col p-4 border border-brand-border rounded-xl cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5">
                          <input
                            type="radio"
                            value={freq.id}
                            className="text-slate-950 focus:ring-slate-950"
                            {...reg3("reportFrequency")}
                          />
                          <span className="text-sm font-bold text-brand-primary">{freq.label}</span>
                        </div>
                        <span className="text-xs text-brand-muted mt-1 pl-6">{freq.desc}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-secondary uppercase tracking-wider mb-2">
                  Minimum Alert Severity Filter
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: "all", label: "Low & Higher" },
                    { id: "medium", label: "Medium & Higher" },
                    { id: "high", label: "High & Critical Only" },
                  ].map((sev) => (
                    <label
                      key={sev.id}
                      className="flex items-center gap-2 p-3 border border-brand-border rounded-lg cursor-pointer hover:bg-slate-50"
                    >
                      <input
                        type="radio"
                        value={sev.id}
                        className="text-slate-950 focus:ring-slate-950"
                        {...reg3("minSeverity")}
                      />
                      <span className="text-xs font-semibold text-brand-secondary">{sev.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <p className="text-xs text-brand-muted bg-slate-50 border border-brand-border rounded-lg p-3">
                Report recipients are managed from <span className="font-semibold text-brand-secondary">Team Settings</span> after setup — you're automatically subscribed as the workspace admin.
              </p>

              <div className="flex justify-between pt-2">
                <Button variant="secondary" type="button" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button type="submit" variant="primary" isLoading={isStep3Loading}>
                  Finalize Setup
                </Button>
              </div>
            </form>
          </Card>
        )}
      </div>
    </div>
  );
};
