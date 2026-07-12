import React from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import type { Run } from "../../types/api.types";

interface RunHistoryChartProps {
  runs: Run[];
}

export const RunHistoryChart: React.FC<RunHistoryChartProps> = ({ runs }) => {
  // Process the runs into chronological date buckets (last 7 days or simply by report sequences)
  const processRunsData = () => {
    const datesMap: Record<string, { date: string; completed: number; failed: number; cancelled: number }> = {};
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      datesMap[dateStr] = { date: dateStr, completed: 0, failed: 0, cancelled: 0 };
    }

    runs.forEach((run) => {
      const runDate = new Date(run.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
      if (datesMap[runDate]) {
        if (run.status === "completed") datesMap[runDate].completed++;
        else if (run.status === "cancelled") datesMap[runDate].cancelled++;
        else datesMap[runDate].failed++;
      }
    });

    return Object.values(datesMap);
  };

  const data = processRunsData();

  return (
    <div className="w-full h-56">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis dataKey="date" stroke="#94a3b8" fontSize={10} tickLine={false} />
          <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} allowDecimals={false} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#0f172a",
              borderRadius: "8px",
              border: "none",
              color: "#fff",
              fontSize: "12px",
            }}
          />
          <Bar dataKey="completed" stackId="a" fill="#10b981" radius={[2, 2, 0, 0]} name="Completed" />
          <Bar dataKey="cancelled" stackId="a" fill="#64748b" radius={[2, 2, 0, 0]} name="Cancelled" />
          <Bar dataKey="failed" stackId="a" fill="#be123c" radius={[2, 2, 0, 0]} name="Failed" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
