import React from "react";
import { Link } from "react-router-dom";
import { useGetReportsQuery } from "../../api/reportApi";
import { Card } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { Table } from "../../components/ui/Table";
import { FileText, ArrowRight, ShieldCheck, Calendar } from "lucide-react";

export const Reports: React.FC = () => {
  const { data: reportsResponse, isLoading } = useGetReportsQuery();

  // Response is wrapped as { statusCode, data, message, success }
  const reports = reportsResponse?.data ?? [];

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-sm text-brand-muted">
        Loading reports...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header Row */}
      <div className="border-b border-brand-border pb-5">
        <h2 className="text-xl font-bold font-display tracking-tight text-brand-primary">
          Reports
        </h2>
        <p className="text-sm text-brand-muted mt-0.5">
          See threat summaries, matched vulnerabilities, and fixes we recommend.
        </p>
      </div>

      {reports.length === 0 ? (
        <div className="text-center py-16 bg-white border border-brand-border rounded-xl space-y-3">
          <div className="mx-auto h-12 w-12 rounded-full bg-emerald-50 flex items-center justify-center">
            <ShieldCheck className="h-6 w-6 text-emerald-600" />
          </div>
          <h3 className="text-sm font-bold text-brand-primary">No reports yet</h3>
          <p className="text-xs text-brand-muted max-w-md mx-auto leading-relaxed">
            You haven't run a scan yet. Go to the Scans page to run your first security scan.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {reports.map((report) => (
            <div
              key={report._id}
              className="bg-white border border-brand-border rounded-xl p-5 hover:border-slate-400 transition-all shadow-[0_1px_2px_rgba(0,0,0,0.01)] flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3.5">
                  <span className="inline-flex items-center gap-1 text-[10px] font-mono text-brand-secondary bg-slate-100 border px-1.5 py-0.5 rounded uppercase">
                    <Calendar className="h-3 w-3" /> {new Date(report.generatedAt ?? report.createdAt).toLocaleDateString()}
                  </span>
                  <Badge severity={report.riskLevel}>{report.riskLevel} risk</Badge>
                </div>
                <h3 className="text-sm font-bold text-brand-primary leading-tight hover:underline">
                  <Link to={`/reports/${report._id}`}>
                    {report.executiveSummary
                      ? `${report.executiveSummary.slice(0, 60)}${report.executiveSummary.length > 60 ? "…" : ""}`
                      : `Report ${report._id.slice(-6)}`}
                  </Link>
                </h3>
                <p className="text-xs text-brand-secondary mt-2 line-clamp-3">
                  {report.executiveSummary || "No summary available for this report."}
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-brand-border flex items-center justify-between text-xs">
                <span className="font-mono text-brand-muted">ID: {report._id.substring(0, 8)}...</span>
                <Link
                  to={`/reports/${report._id}`}
                  className="font-semibold text-slate-800 hover:text-slate-950 flex items-center gap-1 group"
                >
                  View Report <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
