import React, { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useGetReportQuery, useToggleMitigationMutation } from "../../api/reportApi";
import { useGetCurrentSessionQuery } from "../../api/authApi";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Tabs } from "../../components/ui/Tabs";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/ui/Toast";
import {
  ArrowLeft,
  Download,
  ShieldCheck,
  Calendar,
  Check,
  TrendingUp,
  Bug,
} from "lucide-react";

export const ReportDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { showToast } = useToast();

  const { data: session } = useGetCurrentSessionQuery();
  const { data: reportResponse, isLoading, error } = useGetReportQuery(id || "");
  const [toggleMitigation] = useToggleMitigationMutation();

  const [activeTab, setActiveTab] = useState("threats");

  const user = session?.user;
  const isViewer = user?.role === "viewer";

  // Response is wrapped as { statusCode, data, message, success }
  const reportData = reportResponse?.data;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-xs font-mono text-brand-secondary tracking-wider uppercase">
        Loading report...
      </div>
    );
  }

  if (error || !reportData) {
    return (
      <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-center text-sm font-medium">
        We couldn't find this report. Please check the link and try again.
      </div>
    );
  }

  const { report, threats = [], vulnerabilities = [], mitigations = [] } = reportData;

  const handleToggleMitigation = async (mitigationId: string, currentCompleted: boolean) => {
    if (isViewer) return;
    try {
      await toggleMitigation({
        id: mitigationId,
        reportId: id || "",
        isCompleted: !currentCompleted,
      }).unwrap();
      showToast("success", "Updated.");
    } catch {
      showToast("error", "Could not update this item.");
    }
  };

  const handleDownloadReport = () => {
    if (!report?._id) return;
    // Trigger real markdown download from our backend endpoint!
    window.location.href = `/api/reports/${report._id}/download`;
  };

  const tabs = [
    { id: "threats", label: "Threats", icon: <TrendingUp className="h-4 w-4" /> },
    { id: "vulnerabilities", label: "Vulnerabilities", icon: <Bug className="h-4 w-4" /> },
    { id: "mitigations", label: "Fixes", icon: <ShieldCheck className="h-4 w-4" /> },
  ];

  return (
    <div className="space-y-6 print:p-0">
      {/* Back button + export row */}
      <div className="flex items-center justify-between gap-4 border-b border-brand-border pb-5 print:hidden">
        <Link
          to="/reports"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-secondary hover:text-brand-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back to reports
        </Link>

        <Button variant="secondary" size="sm" onClick={handleDownloadReport} className="flex items-center gap-1.5">
          <Download className="h-4 w-4" /> Download Report
        </Button>
      </div>

      {/* Report Header block */}
      <div className="bg-slate-900 text-white rounded-xl p-6 relative overflow-hidden print:bg-white print:text-black print:border print:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10 relative">
          <div>
            <div className="flex items-center gap-3.5 mb-2.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-mono text-slate-300 bg-slate-800 px-2 py-0.5 rounded border border-slate-700 uppercase print:text-black print:border-black">
                <Calendar className="h-3 w-3" /> {new Date(report.generatedAt ?? report.createdAt).toLocaleDateString()}
              </span>
              <Badge severity={report.riskLevel}>{report.riskLevel} risk</Badge>
            </div>
            <h1 className="text-xl md:text-2xl font-bold font-display tracking-tight text-white print:text-black leading-tight">
              {threats[0]?.title ?? "Security Report"}
            </h1>
            <p className="text-xs text-slate-400 mt-2 font-mono print:text-slate-600">
              Report ID: {report._id}
            </p>
          </div>
        </div>
      </div>

      {/* Executive Summary Card */}
      <Card title="Summary" description="A quick overview of what we found.">
        <p className="text-sm text-brand-secondary leading-relaxed whitespace-pre-line">
          {report.executiveSummary}
        </p>

        {report.complianceNotes && (
          <div className="mt-5 pt-4 border-t border-brand-border">
            <h4 className="text-xs font-bold text-brand-primary uppercase tracking-widest mb-1.5">Compliance Notes</h4>
            <p className="text-xs text-brand-secondary leading-relaxed">{report.complianceNotes}</p>
          </div>
        )}
      </Card>

      {/* Inner Dossier Tabs Details */}
      <div className="print:block">
        <div className="print:hidden">
          <Tabs tabs={tabs} activeTab={activeTab} onChange={setActiveTab} />
        </div>

        {/* THREATS TAB PANEL */}
        {(activeTab === "threats" || window.matchMedia("print").matches) && (
          <div className={`${activeTab !== "threats" ? "hidden print:block print:mt-6" : ""}`}>
            <Card title="Threats" description={`${threats.length} threats found that could affect your systems.`}>
              <div className="space-y-4">
                {threats.length === 0 ? (
                  <p className="text-xs font-semibold text-brand-muted text-center py-6">
                    No threats found for this scan.
                  </p>
                ) : (
                  threats.map((threat) => (
                    <div
                      key={threat._id}
                      className="p-4 border border-brand-border rounded-xl bg-slate-50/50 space-y-2"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <h4 className="text-sm font-bold text-brand-primary">{threat.title}</h4>
                        <Badge severity={threat.severity}>{threat.severity}</Badge>
                      </div>
                      <p className="text-xs text-brand-secondary leading-relaxed">{threat.description}</p>
                      <div className="pt-1.5 flex flex-wrap items-center gap-4 text-[10px] font-mono text-slate-500">
                        <span className="capitalize">
                          Type: <span className="font-semibold text-slate-700">{threat.category.replace(/_/g, " ")}</span>
                        </span>
                        {threat.sourceName && (
                          <span>
                            Source:{" "}
                            {threat.sourceUrl ? (
                              <a
                                href={threat.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-slate-700 hover:underline"
                              >
                                {threat.sourceName}
                              </a>
                            ) : (
                              <span className="font-semibold text-slate-700">{threat.sourceName}</span>
                            )}
                          </span>
                        )}
                        {threat.publishedAt && (
                          <span>Published: {new Date(threat.publishedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}

        {/* VULNERABILITIES TAB PANEL */}
        {(activeTab === "vulnerabilities" || window.matchMedia("print").matches) && (
          <div className={`${activeTab !== "vulnerabilities" ? "hidden print:block print:mt-6" : ""}`}>
            <Card title="Vulnerabilities" description={`${vulnerabilities.length} CVEs matched against your tech inventory.`}>
              <div className="space-y-4">
                {vulnerabilities.length === 0 ? (
                  <p className="text-xs font-semibold text-brand-muted text-center py-6">
                    No vulnerabilities found for this scan.
                  </p>
                ) : (
                  vulnerabilities.map((vuln) => (
                    <div
                      key={vuln._id}
                      className="p-4 border border-brand-border rounded-xl bg-white space-y-3"
                    >
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold font-mono text-brand-primary bg-slate-100 border px-1.5 py-0.5 rounded">
                            {vuln.cveId}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-brand-secondary bg-slate-50 px-1 border rounded">
                            CVSS: {vuln.cvssScore}
                          </span>
                          <Badge severity={vuln.severity}>{vuln.severity}</Badge>
                        </div>
                      </div>
                      <p className="text-xs text-brand-secondary leading-relaxed">{vuln.description}</p>

                      <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-50">
                        {vuln.isKnownExploited && (
                          <span className="text-red-700 font-bold bg-red-50 border border-red-100 px-1 rounded uppercase">
                            ⚠️ Known to be exploited
                          </span>
                        )}
                        {vuln.kevDueDate && (
                          <span>Fix by: {new Date(vuln.kevDueDate).toLocaleDateString()}</span>
                        )}
                        {vuln.patchVersion && (
                          <span>Fixed in version: {vuln.patchVersion}</span>
                        )}
                        {vuln.publishedAt && (
                          <span>Published: {new Date(vuln.publishedAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        )}

        {/* MITIGATIONS TAB PANEL */}
        {(activeTab === "mitigations" || window.matchMedia("print").matches) && (
          <div className={`${activeTab !== "mitigations" ? "hidden print:block print:mt-6" : ""}`}>
            <Card title="Fixes" description="Steps you can take to close these gaps. Check them off as you go.">
              <div className="space-y-3">
                {mitigations.length === 0 ? (
                  <p className="text-xs font-semibold text-brand-muted text-center py-6">
                    No fixes listed for this report.
                  </p>
                ) : (
                  mitigations.map((item) => {
                    const isRemediated = item.isCompleted;
                    return (
                      <div
                        key={item._id}
                        className={`flex items-start gap-4 p-4 border rounded-xl transition-all ${
                          isRemediated
                            ? "bg-emerald-50/50 border-emerald-200"
                            : "bg-white border-brand-border"
                        }`}
                      >
                        {!isViewer ? (
                          <button
                            onClick={() => handleToggleMitigation(item._id, item.isCompleted)}
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-all cursor-pointer ${
                              isRemediated
                                ? "bg-emerald-600 border-emerald-600 text-white"
                                : "border-slate-300 bg-white hover:border-slate-500"
                            }`}
                          >
                            {isRemediated && <Check className="h-3.5 w-3.5 stroke-[4]" />}
                          </button>
                        ) : (
                          <div
                            className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                              isRemediated ? "bg-emerald-100 border-emerald-200 text-emerald-700" : "border-slate-200"
                            }`}
                          >
                            {isRemediated && <Check className="h-3 w-3 stroke-[3]" />}
                          </div>
                        )}

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4
                              className={`text-sm font-bold tracking-tight ${
                                isRemediated ? "text-emerald-900 line-through font-medium" : "text-brand-primary"
                              }`}
                            >
                              {item.title}
                            </h4>
                            <span className="text-[9px] font-mono bg-slate-100 text-slate-600 px-1 border rounded uppercase">
                              {item.priority}
                            </span>
                          </div>
                          <p
                            className={`text-xs ${
                              isRemediated ? "text-emerald-700" : "text-brand-secondary"
                            } leading-relaxed`}
                          >
                            {item.recommendation}
                          </p>
                          <div className="text-[10px] text-slate-500 font-mono mt-2 flex flex-wrap items-center gap-3">
                            <span>
                              Type: <span className="font-semibold">{item.actionType}</span>
                            </span>
                            {item.estimatedEffort && (
                              <span>
                                Effort: <span className="font-semibold">{item.estimatedEffort}</span>
                              </span>
                            )}
                            {item.vulnerabilityId?.cveId && (
                              <span>
                                For: <span className="font-semibold">{item.vulnerabilityId.cveId}</span>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
