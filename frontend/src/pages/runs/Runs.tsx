import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useGetCurrentSessionQuery } from "../../api/authApi";
import {
  useGetRunsQuery,
  useStartRunMutation,
  useStopRunMutation,
} from "../../api/runApi";
import { useRunStream } from "../../features/runs/hooks/useRunStream";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Table } from "../../components/ui/Table";
import { useToast } from "../../components/ui/Toast";
import {
  Activity,
  Play,
  XCircle,
  Terminal,
  Clock,
  CheckCircle2,
  AlertOctagon,
  ArrowDown,
} from "lucide-react";

export const Runs: React.FC = () => {
  const location = useLocation();
  const { showToast } = useToast();
  const terminalBottomRef = useRef<HTMLDivElement>(null);

  const { data: session } = useGetCurrentSessionQuery();
  const { data: runsResponse } = useGetRunsQuery(undefined, {
    pollingInterval: 10000, // keep list updated
  });

  // Response is wrapped as { statusCode, data, message, success }
  const runs = runsResponse?.data ?? [];

  const [startRun, { isLoading: isStarting }] = useStartRunMutation();
  const [stopRun, { isLoading: isCancelling }] = useStopRunMutation();

  const user = session?.user;
  const isViewer = user?.role === "viewer";

  // Active viewing run ID
  const [selectedRunId, setSelectedRunId] = useState<string | undefined>(undefined);

  // Read router redirect states if they just triggered from dashboard
  useEffect(() => {
    const redirectRunId = location.state?.activeRunId;
    if (redirectRunId) {
      setSelectedRunId(redirectRunId);
      // Clear navigation state so a reload doesn't keep locking it
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Hook up SSE stream
  const { activeRun, error: streamError } = useRunStream(selectedRunId);

  // If we have runs but haven't selected one, let's default to the latest active run (or latest run)
  useEffect(() => {
    if (!selectedRunId && runs.length > 0) {
      // Find the first running or completed run to show
      const running = runs.find((r) => r.status === "running");
      if (running) {
        setSelectedRunId(running._id);
      } else {
        setSelectedRunId(runs[0]._id);
      }
    }
  }, [runs, selectedRunId]);

  // Scroll terminal logs to bottom on changes
  useEffect(() => {
    if (terminalBottomRef.current) {
      terminalBottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [activeRun?.logs]);

  // Get current run object: prioritize real-time activeRun from SSE over standard polled runs state
  const currentRun =
    activeRun?._id === selectedRunId ? activeRun : runs.find((r) => r._id === selectedRunId);

  // The polled run-list objects don't include a `logs` array (only the SSE-streamed
  // activeRun does), so always fall back to an empty array for safe rendering.
  const currentRunLogs = currentRun?.logs ?? [];

  const handleTriggerRun = async () => {
    if (isViewer) return;
    try {
      const response = await startRun().unwrap();
      showToast("success", "Cybersecurity scan dispatched to agent pipelines.");
      setSelectedRunId(response._id ?? response.data?._id);
    } catch {
      showToast("error", "Failed to start analysis pipeline.");
    }
  };

  const handleStopRun = async (runId: string) => {
    if (isViewer) return;
    try {
      await stopRun(runId).unwrap();
      showToast("success", "Analysis run cancelled successfully.");
    } catch {
      showToast("error", "Failed to terminate active run.");
    }
  };

  // Map progress bar percents
  const getStagePercentage = (stage?: string) => {
    if (!stage) return 0;
    const stages: Record<string, number> = {
      threat_intelligence: 25,
      vulnerability_research: 50,
      incident_response: 75,
      report_writing: 100,
    };
    return stages[stage] || 0;
  };

  const getStageLabel = (stage?: string) => {
    if (!stage) return "Initializing";
    return stage
      .split("_")
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(" ");
  };

  const getStatusIcon = (status?: string) => {
    if (status === "running") return <Activity className="h-5 w-5 text-blue-500 animate-spin" />;
    if (status === "completed") return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    if (status === "failed") return <AlertOctagon className="h-5 w-5 text-rose-500" />;
    return <XCircle className="h-5 w-5 text-slate-400" />;
  };

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border pb-5">
        <div>
          <h2 className="text-xl font-bold font-display tracking-tight text-brand-primary">
            Security Intelligence Audit Logs
          </h2>
          <p className="text-sm text-brand-muted mt-0.5">
            Monitor real-time CVE correlation, threat context scanning, and generative report pipelines.
          </p>
        </div>

        {!isViewer && (
          <Button
            variant="primary"
            onClick={handleTriggerRun}
            isLoading={isStarting}
            disabled={runs.some((r) => r.status === "running")}
            className="flex items-center gap-1.5"
          >
            <Play className="h-4 w-4" />
            <span>Trigger Analysis Scan</span>
          </Button>
        )}
      </div>

      {/* TOP: ACTIVE SCANNER / WORKFLOW WORKSPACE */}
      {currentRun && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: Terminal and Stream outputs */}
          <div className="lg:col-span-2 space-y-4">
            {/* Terminal Panel */}
            <div className="bg-slate-950 border border-slate-900 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[400px]">
              {/* Terminal header */}
              <div className="bg-slate-900 px-4 py-3 border-b border-slate-950 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-300 font-mono">
                    SecOps Pipeline Stream: {currentRun._id.substring(0, 8)}...
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-red-500/85" />
                  <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/85" />
                  <span className="h-2.5 w-2.5 rounded-full bg-green-500/85" />
                </div>
              </div>

              {/* Logs terminal box */}
              <div className="flex-1 p-5 overflow-y-auto space-y-2 font-mono text-[11px] leading-relaxed text-slate-300 select-all">
                {currentRunLogs.length === 0 ? (
                  <p className="text-slate-500 italic">Bootstrapping cryptographic pipeline structures...</p>
                ) : (
                  currentRunLogs.map((log, idx) => {
                    const isError = log.level === "error";
                    const isWarn = log.level === "warn";
                    return (
                      <div key={idx} className="flex gap-2">
                        <span className="text-slate-600 shrink-0 select-none">[{log.timestamp.substring(11, 19)}]</span>
                        <span
                          className={`shrink-0 select-none uppercase font-bold text-[9px] px-1 rounded ${
                            isError
                              ? "bg-rose-950 text-rose-300"
                              : isWarn
                              ? "bg-amber-950 text-amber-300"
                              : "bg-slate-800 text-slate-300"
                          }`}
                        >
                          {log.level}
                        </span>
                        <span className={isError ? "text-rose-400 font-semibold" : isWarn ? "text-amber-400" : ""}>
                          {log.message}
                        </span>
                      </div>
                    );
                  })
                )}
                {currentRun.status === "running" && (
                  <div className="flex items-center gap-2 text-slate-400 animate-pulse mt-3 pl-1 select-none">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-ping" />
                    <span>Pipeline executing {currentRun.currentStage ? currentRun.currentStage.replace("_", " ") : "pre-flight checks"}...</span>
                  </div>
                )}
                {currentRun.status === "failed" && currentRun.failureReason && (
                  <div className="flex gap-2 text-rose-400 mt-3 pl-1">
                    <span className="shrink-0 select-none uppercase font-bold text-[9px] px-1 rounded bg-rose-950 text-rose-300">
                      error
                    </span>
                    <span className="font-semibold">{currentRun.failureReason}</span>
                  </div>
                )}
                <div ref={terminalBottomRef} />
              </div>
            </div>
          </div>

          {/* Column 3: Current Run Metadata & Pipeline progress */}
          <div className="space-y-4">
            <Card title="Audit Operations Status" description="State parameters of selected security audit.">
              <div className="space-y-5">
                {/* Visual Circle Indicator */}
                <div className="flex items-center gap-3 bg-slate-50 border border-brand-border p-4 rounded-xl">
                  {getStatusIcon(currentRun.status)}
                  <div>
                    <h4 className="text-sm font-bold text-brand-primary uppercase tracking-wide">
                      {currentRun.status}
                    </h4>
                    <p className="text-xs text-brand-muted font-mono leading-none mt-1">
                      Audit run sequence
                    </p>
                  </div>
                </div>

                {/* Agent Pipeline Progress bar */}
                {currentRun.status === "running" && (
                  <div className="space-y-2 p-4 bg-blue-50/50 border border-blue-100 rounded-xl">
                    <div className="flex justify-between text-xs font-bold text-blue-900">
                      <span>Pipeline: {getStageLabel(currentRun.currentStage)}</span>
                      <span>{getStagePercentage(currentRun.currentStage)}%</span>
                    </div>
                    <div className="h-2 w-full bg-blue-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-600 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${getStagePercentage(currentRun.currentStage)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Metrics */}
                <div className="space-y-3 pt-2">
                  <div className="flex justify-between text-xs border-b border-slate-100 pb-2">
                    <span className="text-brand-secondary font-medium">Started At</span>
                    <span className="text-brand-primary font-semibold font-mono">
                      {new Date(currentRun.startedAt ?? currentRun.createdAt).toLocaleTimeString()}
                    </span>
                  </div>
                  {currentRun.completedAt && (
                    <div className="flex justify-between text-xs border-b border-slate-100 pb-2">
                      <span className="text-brand-secondary font-medium">Completed At</span>
                      <span className="text-brand-primary font-semibold font-mono">
                        {new Date(currentRun.completedAt).toLocaleTimeString()}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-xs border-b border-slate-100 pb-2">
                    <span className="text-brand-secondary font-medium">Unique Task ID</span>
                    <span className="text-brand-primary font-semibold font-mono text-[10px]">
                      {currentRun._id}
                    </span>
                  </div>
                </div>

                {/* Cancel controls */}
                {currentRun.status === "running" && !isViewer && (
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full"
                    onClick={() => handleStopRun(currentRun._id)}
                    isLoading={isCancelling}
                  >
                    <XCircle className="h-4 w-4 mr-1.5" /> Stop Pipeline execution
                  </Button>
                )}
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* BOTTOM: GENERAL RUNS TIMELINE HISTORY */}
      <Card title="Analysis Scans History Log" description="Log table listing previous audits. Click to load outputs inside terminal above.">
        <Table headers={["Audit Run ID", "Status", "Timestamp", "Completed At", "Pipeline Stage", "Actions"]}>
          {runs.map((run) => {
            const isSelected = run._id === selectedRunId;
            return (
              <tr
                key={run._id}
                onClick={() => setSelectedRunId(run._id)}
                className={`border-b border-brand-border last:border-0 hover:bg-slate-50 transition-colors cursor-pointer ${
                  isSelected ? "bg-slate-50 font-semibold border-l-2 border-l-slate-950" : ""
                }`}
              >
                <td className="px-5 py-3 text-xs font-bold font-mono text-brand-primary">
                  {run._id}
                </td>
                <td className="px-5 py-3">
                  <Badge severity={run.status === "completed" ? "low" : run.status === "failed" ? "critical" : "default"}>
                    {run.status}
                  </Badge>
                </td>
                <td className="px-5 py-3 text-xs text-brand-secondary font-medium">
                  {new Date(run.createdAt).toLocaleString()}
                </td>
                <td className="px-5 py-3 text-xs text-brand-secondary font-medium">
                  {run.completedAt ? new Date(run.completedAt).toLocaleTimeString() : "-"}
                </td>
                <td className="px-5 py-3 text-xs text-brand-secondary font-mono">
                  {run.currentStage ? getStageLabel(run.currentStage) : "-"}
                </td>
                <td className="px-5 py-3">
                  <span className="text-xs text-brand-primary hover:underline font-semibold flex items-center gap-1">
                    Load log <ArrowDown className="h-3.5 w-3.5" />
                  </span>
                </td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </div>
  );
};
