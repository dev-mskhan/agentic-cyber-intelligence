import React from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { ReportSummary } from "../../types/api.types";

interface RiskTrendChartProps {
  reports: ReportSummary[];
}

export const RiskTrendChart: React.FC<RiskTrendChartProps> = ({ reports }) => {
  const riskWeights = {
    low: 1,
    medium: 2,
    high: 3,
    critical: 4,
  };

  const processTrendData = () => {
    // Take up to 7 latest reports, reverse them to be chronological (oldest to newest)
    const sorted = [...reports]
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .slice(-7);

    return sorted.map((r, idx) => ({
      sequence: `R-${idx + 1}`,
      riskValue: riskWeights[r.riskLevel] || 1,
      riskName: r.riskLevel.toUpperCase(),
      date: new Date(r.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
    }));
  };

  const data = processTrendData();

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-56 bg-slate-50 rounded-lg text-xs text-brand-muted border border-dashed border-brand-border">
        Generate your first intelligence report to chart risk levels.
      </div>
    );
  }

  const customYTickFormatter = (value: number) => {
    if (value === 1) return "LOW";
    if (value === 2) return "MED";
    if (value === 3) return "HIGH";
    if (value === 4) return "CRIT";
    return "";
  };

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
          <YAxis
            stroke="#94a3b8"
            fontSize={10}
            domain={[1, 4]}
            tickCount={4}
            tickLine={false}
            tickFormatter={customYTickFormatter}
          />
          <Tooltip
            formatter={(value: any) => [customYTickFormatter(value), "Exposure Level"]}
            contentStyle={{
              backgroundColor: "#0f172a",
              borderRadius: "8px",
              border: "none",
              color: "#fff",
              fontSize: "12px",
            }}
          />
          <Line
            type="monotone"
            dataKey="riskValue"
            stroke="#0f172a"
            strokeWidth={2}
            dot={{ r: 4, fill: "#0f172a", strokeWidth: 0 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
