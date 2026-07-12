import React from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

interface SeverityBreakdownProps {
  data: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export const SeverityBreakdownChart: React.FC<SeverityBreakdownProps> = ({ data }) => {
  const chartData = [
    { name: "Critical", value: data.critical, color: "#be123c" }, // --color-sev-critical
    { name: "High", value: data.high, color: "#d97706" },       // --color-sev-high
    { name: "Medium", value: data.medium, color: "#eab308" },   // --color-sev-medium
    { name: "Low", value: data.low, color: "#10b981" },         // --color-sev-low
  ].filter((item) => item.value > 0);

  if (chartData.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 bg-slate-50 rounded-lg text-xs text-brand-muted border border-dashed border-brand-border">
        No active vulnerabilities detected to chart.
      </div>
    );
  }

  return (
    <div className="w-full h-48 flex items-center justify-between">
      <div className="w-1/2 h-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={70}
              paddingAngle={4}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "#0f172a",
                borderRadius: "8px",
                border: "none",
                color: "#fff",
                fontSize: "12px",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="w-1/2 pl-4 space-y-2">
        {chartData.map((item) => (
          <div key={item.name} className="flex items-center justify-between text-xs font-semibold">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-brand-secondary">{item.name}</span>
            </div>
            <span className="text-brand-primary bg-slate-100 px-1.5 py-0.5 rounded font-mono border border-slate-200">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
