import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CHART_MARGIN = { top: 5, right: 20, bottom: 5, left: 0 };
const TOOLTIP_STYLE = { backgroundColor: "var(--brand-ink-char)", border: "none", borderRadius: "12px" };
const COLORS = ["var(--brand-sky-royal)", "var(--brand-amber)", "var(--brand-emerald)"];

export default React.memo(function PerformanceChart({ chartData = [], teamNames = [] }) {
  return (
    <div className="mb-12 mt-16 rounded-[32px] border border-border bg-card p-6 shadow-sm md:p-8">
      <h2 className="mb-2 text-2xl font-black">Performance History</h2>
      <p className="mb-8 text-muted-foreground">
        Tracking rating point progression over the last 5 months.
      </p>
      <div className="h-[300px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
            <XAxis dataKey="name" stroke="#888" tick={{ fill: "#888" }} axisLine={false} tickLine={false} />
            <YAxis stroke="#888" tick={{ fill: "#888" }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={TOOLTIP_STYLE} />
            {teamNames.map((teamName, index) => (
              <Line
                key={teamName}
                type="monotone"
                dataKey={teamName}
                stroke={COLORS[index % COLORS.length]}
                strokeWidth={3}
                dot={{ r: 4 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
});
