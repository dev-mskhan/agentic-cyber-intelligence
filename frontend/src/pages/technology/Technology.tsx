import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { techItemSchema } from "../../features/technology/schemas";
import { useGetCurrentSessionQuery } from "../../api/authApi";
import {
  useGetTechnologyQuery,
  useAddTechnologyMutation,
  useBulkAddTechnologyMutation,
  useDeleteTechnologyMutation,
  useLazySearchCatalogQuery,
} from "../../api/technologyApi";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { Table } from "../../components/ui/Table";
import { Badge } from "../../components/ui/Badge";
import { Card } from "../../components/ui/Card";
import { useToast } from "../../components/ui/Toast";
import {
  Layers,
  Plus,
  Trash2,
  FileSpreadsheet,
  Search,
  Check,
  Cpu,
  SlidersHorizontal,
} from "lucide-react";

export const Technology: React.FC = () => {
  const { showToast } = useToast();
  const { data: session } = useGetCurrentSessionQuery();
  const { data: techInventoryResponse } = useGetTechnologyQuery();
  const [addTech, { isLoading: isAdding }] = useAddTechnologyMutation();
  const [bulkAddTech, { isLoading: isBulkLoading }] = useBulkAddTechnologyMutation();
  const [deleteTech] = useDeleteTechnologyMutation();

  // Response is wrapped as { statusCode, data, message, success }
  const techInventory = techInventoryResponse?.data ?? [];

  // Filters state
  const [envFilter, setEnvFilter] = useState<"all" | "production" | "test">("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Add panel collapsible state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);

  // Autocomplete state
  const [autocompleteQuery, setAutocompleteQuery] = useState("");
  const [catalogQuery, { data: catalogMatches = [] }] = useLazySearchCatalogQuery();
  const [showAutocomplete, setShowAutocomplete] = useState(false);

  // Bulk paste text state
  const [csvContent, setCsvContent] = useState("");

  const user = session?.user;
  const isViewer = user?.role === "viewer";

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(techItemSchema),
    defaultValues: {
      product: "",
      version: "",
      purpose: "",
      environment: "production" as const,
      criticality: "medium" as const,
    },
  });

  // Autocomplete debounce searching
  useEffect(() => {
    const timer = setTimeout(() => {
      if (autocompleteQuery.trim().length >= 1) {
        catalogQuery(autocompleteQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [autocompleteQuery, catalogQuery]);

  const selectCatalogProduct = (product: string) => {
    setValue("product", product);
    setAutocompleteQuery(product);
    setShowAutocomplete(false);
  };

  const onAddSubmit = async (data: any) => {
    if (isViewer) return;
    try {
      await addTech(data).unwrap();
      showToast("success", `${data.product} asset declared successfully.`);
      reset();
      setAutocompleteQuery("");
      setIsFormOpen(false);
    } catch {
      showToast("error", "Failed to add tech asset.");
    }
  };

  const handleBulkImport = async () => {
    if (isViewer) return;
    if (!csvContent.trim()) {
      showToast("error", "Input cannot be empty.");
      return;
    }

    const lines = csvContent.split("\n");
    const rows = [];
    for (let line of lines) {
      line = line.trim();
      if (!line) continue;
      const parts = line.split(",").map((p) => p.trim());
      if (parts.length >= 2) {
        rows.push({
          product: parts[0],
          version: parts[1],
          purpose: parts[2] || "Bulk imported system",
          environment: parts[3] || "production",
          criticality: parts[4] || "medium",
        });
      }
    }

    if (rows.length === 0) {
      showToast("error", "Format error. Declare records matching (Product, Version).");
      return;
    }

    try {
      await bulkAddTech({ rows }).unwrap();
      showToast("success", `Successfully loaded ${rows.length} records in bulk.`);
      setCsvContent("");
      setIsBulkOpen(false);
    } catch {
      showToast("error", "Bulk loading failed.");
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (isViewer) return;
    try {
      await deleteTech(id).unwrap();
      showToast("success", `${name} asset removed from monitoring inventories.`);
    } catch {
      showToast("error", "Failed to delete system asset.");
    }
  };

  // Filter lists based on inputs
  const filteredInventory = techInventory.filter((item) => {
    const matchesEnv = envFilter === "all" || item.environment === envFilter;
    const matchesQuery =
      item.product.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.purpose ?? "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesEnv && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border pb-5">
        <div>
          <h2 className="text-xl font-bold font-display tracking-tight text-brand-primary">
            Technology Stack & Inventories
          </h2>
          <p className="text-sm text-brand-muted mt-0.5">
            Declare your organization's technologies to trace live exploits, zero-days, and patches.
          </p>
        </div>

        {!isViewer && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="secondary"
              onClick={() => {
                setIsBulkOpen(!isBulkOpen);
                setIsFormOpen(false);
              }}
              className="flex items-center gap-1.5"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Bulk Paste</span>
            </Button>
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                setIsFormOpen(!isFormOpen);
                setIsBulkOpen(false);
              }}
              className="flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              <span>Single Asset</span>
            </Button>
          </div>
        )}
      </div>

      {/* SINGLE ADD FORM COLLAPSIBLE */}
      {isFormOpen && !isViewer && (
        <Card title="Declare Technology Asset" description="Define specific production or test instances.">
          <form onSubmit={handleSubmit(onAddSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Product Autocomplete */}
              <div className="relative">
                <label className="block text-xs font-semibold text-brand-secondary uppercase tracking-wider mb-1.5">
                  Product Catalog
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={autocompleteQuery}
                    onChange={(e) => {
                      setAutocompleteQuery(e.target.value);
                      setValue("product", e.target.value);
                      setShowAutocomplete(true);
                    }}
                    placeholder="Search e.g. nginx, redis..."
                    className="w-full px-3 py-2 text-sm bg-white border border-brand-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  />
                </div>
                {errors.product && (
                  <p className="mt-1 text-xs text-red-600 font-medium">{errors.product.message}</p>
                )}

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
                label="Product Version"
                type="text"
                placeholder="e.g. 1.20.1"
                error={errors.version?.message}
                {...register("version")}
              />
            </div>

            <Input
              label="Business Purpose"
              type="text"
              placeholder="e.g. Host client facing web store front page"
              error={errors.purpose?.message}
              {...register("purpose")}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-brand-secondary uppercase tracking-wider mb-1.5">
                  Deployment Environment
                </label>
                <select
                  className="w-full px-3 py-2 text-sm bg-white border border-brand-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  {...register("environment")}
                >
                  <option value="production">Production Systems</option>
                  <option value="test">Staging & Testing</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-secondary uppercase tracking-wider mb-1.5">
                  Asset Criticality level
                </label>
                <select
                  className="w-full px-3 py-2 text-sm bg-white border border-brand-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                  {...register("criticality")}
                >
                  <option value="low">Low Exposure</option>
                  <option value="medium">Medium Impact</option>
                  <option value="high">High Corporate Value</option>
                  <option value="critical">Critical Core Infrastructure</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="secondary" size="sm" onClick={() => setIsFormOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" isLoading={isAdding}>
                Register Asset
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* BULK PASTE COLLAPSIBLE */}
      {isBulkOpen && !isViewer && (
        <Card title="CSV Copy-Paste Bulk Load" description="Load systems in bulk using simple line-by-line values.">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-brand-secondary uppercase tracking-wider mb-1.5">
                Paste CSV Rows (Product, Version, Purpose, Env, Criticality)
              </label>
              <textarea
                rows={5}
                value={csvContent}
                onChange={(e) => setCsvContent(e.target.value)}
                placeholder="Nginx, 1.19.0, Gateway API reverse proxy, production, critical&#10;Postgres, 13.1, Primary operational records store, production, high"
                className="w-full px-3 py-2 text-xs font-mono bg-white border border-brand-border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
              />
            </div>
            <p className="text-[10px] text-brand-muted leading-relaxed">
              * Put product and version first (comma-separated). Lines missing fields default environment to production and criticality to medium automatically.
            </p>
            <div className="flex gap-2 justify-end">
              <Button variant="secondary" size="sm" onClick={() => setIsBulkOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleBulkImport} isLoading={isBulkLoading}>
                Import Data
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* ACTIVE TABLE LIST & FILTERS */}
      <Card
        title="Operating Software Inventory"
        description={`${filteredInventory.length} systems declared under monitoring.`}
      >
        {/* Filters control row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-brand-border">
          {/* Search bar */}
          <div className="relative max-w-sm w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by system product or purpose..."
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-brand-border rounded-lg shadow-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
            />
            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-slate-400" />
          </div>

          {/* Environment filter tags */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
            {[
              { id: "all", label: "All Environment" },
              { id: "production", label: "Production" },
              { id: "test", label: "Staging/Test" },
            ].map((tag) => {
              const active = envFilter === tag.id;
              return (
                <button
                  key={tag.id}
                  onClick={() => setEnvFilter(tag.id as any)}
                  className={`px-3 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                    active
                      ? "bg-slate-950 text-white shadow-xs"
                      : "text-brand-secondary hover:text-brand-primary"
                  }`}
                >
                  {tag.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Systems data table */}
        <Table
          headers={["Product Name", "Operating Version", "Business Purpose", "Environment", "Criticality", "Actions"]}
          isEmpty={filteredInventory.length === 0}
          emptyMessage="No software inventories match the selected criteria."
        >
          {filteredInventory.map((item) => (
            <tr key={item._id} className="border-b border-brand-border last:border-0 hover:bg-slate-50/50">
              <td className="px-5 py-3.5 text-sm font-bold text-brand-primary flex items-center gap-2">
                <Cpu className="h-4 w-4 text-slate-400 shrink-0" />
                <span>{item.product}</span>
              </td>
              <td className="px-5 py-3.5 text-xs font-semibold font-mono text-brand-secondary">
                v{item.version}
              </td>
              <td className="px-5 py-3.5 text-xs text-brand-secondary max-w-xs truncate">
                {item.purpose}
              </td>
              <td className="px-5 py-3.5">
                <span className="text-[10px] font-bold font-mono uppercase tracking-wider bg-slate-100 border border-slate-200 text-slate-800 px-1.5 py-0.5 rounded">
                  {item.environment}
                </span>
              </td>
              <td className="px-5 py-3.5">
                <Badge severity={item.criticality}>{item.criticality}</Badge>
              </td>
              <td className="px-5 py-3.5">
                {!isViewer ? (
                  <button
                    onClick={() => handleDelete(item._id, item.product)}
                    className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-1 rounded-md transition-all cursor-pointer"
                  >
                    <Trash2 className="h-4.5 w-4.5" />
                  </button>
                ) : (
                  <span className="text-[10px] text-brand-muted italic font-medium">Read Only</span>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Card>
    </div>
  );
};
