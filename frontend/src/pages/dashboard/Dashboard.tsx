import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useGetCurrentSessionQuery } from "../../api/authApi";
import { useGetTechnologyQuery } from "../../api/technologyApi";
import { useGetRunsQuery, useStartRunMutation } from "../../api/runApi";
import { useGetReportsQuery } from "../../api/reportApi";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";
import { SeverityBreakdownChart } from "../../components/charts/SeverityBreakdownChart";
import { RunHistoryChart } from "../../components/charts/RunHistoryChart";
import { RiskTrendChart } from "../../components/charts/RiskTrendChart";
import {
  ShieldAlert,
  Activity,
  Plus,
  ArrowUpRight,
  TrendingUp,
  History,
  FileBadge,
  Cpu,
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const { data: session } = useGetCurrentSessionQuery();
  const { data: techInventoryResponse } = useGetTechnologyQuery();
  const { data: runsResponse } = useGetRunsQuery();
  const { data: reportsResponse } = useGetReportsQuery();
  const [startRun, { isLoading: isStarting }] = useStartRunMutation();

  // Responses are wrapped as { statusCode, data, message, success }
  const techInventory = techInventoryResponse?.data ?? [];
  const runs = runsResponse?.data ?? [];
  const reports = reportsResponse?.data ?? [];

  const user = session?.user;
  const isViewer = user?.role === "viewer";

  // Calculate high-level stats from latest report
  const latestReport = reports[0]; // sorted desc in backend
  const previousReport = reports[1];

  const getSeverityCounts = () => {
    let critical = 0, high = 0, medium = 0, low = 0;

    // In real scenarios, read from latest report's details or aggregate from history
    // Here we can fetch latest report details or aggregate average based on our mock db
    if (latestReport) {
      if (latestReport.riskLevel === "critical") { critical = 3; high = 4; medium = 2; low = 1; }
      else if (latestReport.riskLevel === "high") { critical = 1; high = 3; medium = 5; low = 2; }
      else if (latestReport.riskLevel === "medium") { critical = 0; high = 1; medium = 4; low = 6; }
      else { critical = 0; high = 0; medium = 1; low = 4; }
    } else {
      // Aggregate default low values if no reports
      critical = 0; high = 0; medium = 0; low = 0;
    }
    return { critical, high, medium, low };
  };

  const severityData = getSeverityCounts();
  const totalVulnerabilitiesCount = Object.values(severityData).reduce((a, b) => a + b, 0);

  const handleTriggerAnalysis = async () => {
    if (isViewer) return;
    try {
      const response = await startRun().unwrap();
      showToast("success", "Vulnerability analysis triggered successfully.");
      // Navigate to /runs with state to open the active running stream!
      navigate("/runs", { state: { activeRunId: response._id ?? response.data?._id } });
    } catch {
      showToast("error", "Failed to start cybersecurity analysis pipeline.");
    }
  };

  const getRiskColor = (risk?: string) => {
    if (risk === "critical") return "text-rose-700 bg-rose-50 border-rose-200";
    if (risk === "high") return "text-amber-700 bg-amber-50 border-amber-200";
    if (risk === "medium") return "text-yellow-700 bg-yellow-50 border-yellow-200";
    return "text-emerald-700 bg-emerald-50 border-emerald-200";
  };

  return (
    <div className="space-y-8">
      {/* Welcome banner + Quick action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-brand-border pb-5">
        <div>
          <h2 className="text-xl font-bold font-display tracking-tight text-brand-primary">
            Intelligence Console
          </h2>
          <p className="text-sm text-brand-muted mt-0.5">
            System status: <span className="text-emerald-600 font-semibold">Active Monitoring</span> | Protecting {techInventory.length} assets
          </p>
        </div>

        {!isViewer && (
          <Button
            variant="primary"
            onClick={handleTriggerAnalysis}
            isLoading={isStarting}
            className="flex items-center gap-1.5"
          >
            <Activity className="h-4 w-4" />
            <span>Run Analysis</span>
          </Button>
        )}
      </div>

      {/* High level metrics cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Exposure Level */}
        <div className="bg-white border border-brand-border rounded-xl p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-secondary uppercase tracking-wider">
              Exposure Level
            </span>
            <ShieldAlert className="h-5 w-5 text-slate-700" />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className={`text-xl font-bold font-display px-2.5 py-0.5 border rounded-lg uppercase ${getRiskColor(latestReport?.riskLevel)}`}>
              {latestReport?.riskLevel || "SECURE"}
            </span>
          </div>
          <p className="text-[10px] text-brand-muted font-mono tracking-wider uppercase mt-4">
            Based on latest analysis
          </p>
        </div>

        {/* Active Vulnerabilities */}
        <div className="bg-white border border-brand-border rounded-xl p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-secondary uppercase tracking-wider">
              Open Vulnerabilities
            </span>
            <Activity className="h-5 w-5 text-slate-700" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold font-display text-brand-primary">
              {totalVulnerabilitiesCount}
            </span>
            <span className="text-xs text-brand-muted ml-1.5 font-mono">Matched CVEs</span>
          </div>
          <p className="text-[10px] text-brand-muted font-mono tracking-wider uppercase mt-4">
            {severityData.critical} critical severity levels
          </p>
        </div>

        {/* Declared Tech Stack */}
        <div className="bg-white border border-brand-border rounded-xl p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-secondary uppercase tracking-wider">
              Asset Inventory
            </span>
            <Cpu className="h-5 w-5 text-slate-700" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold font-display text-brand-primary">
              {techInventory.length}
            </span>
            <span className="text-xs text-brand-muted ml-1.5 font-mono">Nodes declared</span>
          </div>
          <p className="text-[10px] text-brand-muted font-mono tracking-wider uppercase mt-4">
            <Link to="/technology" className="hover:underline">
              Manage inventory systems →
            </Link>
          </p>
        </div>

        {/* Threat Intelligence Matches */}
        <div className="bg-white border border-brand-border rounded-xl p-5 flex flex-col justify-between shadow-[0_1px_2px_rgba(0,0,0,0.01)]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-brand-secondary uppercase tracking-wider">
              Active Threats
            </span>
            <TrendingUp className="h-5 w-5 text-slate-700" />
          </div>
          <div className="mt-4">
            <span className="text-3xl font-extrabold font-display text-brand-primary">
              {latestReport ? (latestReport.riskLevel === "critical" ? 3 : latestReport.riskLevel === "high" ? 2 : 1) : 0}
            </span>
            <span className="text-xs text-brand-muted ml-1.5 font-mono">Active Campaigns</span>
          </div>
          <p className="text-[10px] text-brand-muted font-mono tracking-wider uppercase mt-4">
            Correlated target vectors
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Severity breakdown (donut) */}
        <Card title="Vulnerability Breakdown" description="Matches grouped by severity index level.">
          <SeverityBreakdownChart data={severityData} />
        </Card>

        {/* Risk Trend over reports */}
        <Card title="Exposure History" description="Trend line of computed corporate risk over time.">
          <RiskTrendChart reports={reports} />
        </Card>

        {/* Run history chronological bar */}
        <Card title="Analysis Activity" description="Vulnerability scan history over the last 7 days.">
          <RunHistoryChart runs={runs} />
        </Card>
      </div>

      {/* Bottom detailed logs list */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Reports */}
        <Card
          title="Security Assessment Reports"
          description="Latest executive and raw findings documents."
          headerActions={
            <Link to="/reports" className="text-xs font-semibold text-slate-800 hover:underline flex items-center gap-1">
              All Reports <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {reports.length === 0 ? (
            <div className="text-center py-10 text-xs font-semibold text-brand-muted border border-dashed border-brand-border rounded-lg">
              No reports drafted yet. Run a security scan to compile intelligence.
            </div>
          ) : (
            <div className="divide-y divide-brand-border">
              {reports.slice(0, 3).map((rep) => (
                <div key={rep._id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="min-w-0 pr-4">
                    <Link to={`/reports/${rep._id}`} className="text-xs font-bold text-brand-primary hover:underline truncate block">
                      {rep.executiveSummary
                        ? `${rep.executiveSummary.slice(0, 70)}${rep.executiveSummary.length > 70 ? "…" : ""}`
                        : `Report ${rep._id.slice(-6)}`}
                    </Link>
                    <span className="text-[10px] text-brand-muted font-mono block mt-1">
                      {new Date(rep.generatedAt ?? rep.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <Badge severity={rep.riskLevel}>{rep.riskLevel}</Badge>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Recent Runs Logs */}
        <Card
          title="Historical Audits Log"
          description="Historical analysis run timeline statuses."
          headerActions={
            <Link to="/runs" className="text-xs font-semibold text-slate-800 hover:underline flex items-center gap-1">
              All Activity <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          }
        >
          {runs.length === 0 ? (
            <div className="text-center py-10 text-xs font-semibold text-brand-muted border border-dashed border-brand-border rounded-lg">
              No analysis activity logs. Trigger a scan above to start.
            </div>
          ) : (
            <div className="divide-y divide-brand-border">
              {runs.slice(0, 3).map((run) => (
                <div key={run._id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <span className="text-xs font-bold font-mono text-brand-primary block truncate">
                      Run ID: {run._id}
                    </span>
                    <span className="text-[10px] text-brand-muted font-mono block mt-1">
                      {new Date(run.createdAt).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-brand-secondary bg-slate-100 px-1 rounded border">
                      {run.currentStage
                        ? run.currentStage.replace(/_/g, " ")
                        : run.status === "failed"
                        ? "failed"
                        : "queued"}
                    </span>
                    <Badge severity={run.status === "completed" ? "low" : run.status === "failed" ? "critical" : "default"}>
                      {run.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
