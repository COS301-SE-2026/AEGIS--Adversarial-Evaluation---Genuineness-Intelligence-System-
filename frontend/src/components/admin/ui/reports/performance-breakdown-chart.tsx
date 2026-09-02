"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { PerformanceBreakdownResponse } from "@/app/(admin)/types/reporting";

interface PerformanceBreakdownChartProps {
  data: PerformanceBreakdownResponse;
}

export function PerformanceBreakdownChart({ data }: Readonly<PerformanceBreakdownChartProps>) {
  const chartData = data.slices.map((s) => ({
    ...s,
    success_percent: Math.round(s.avg_success_rate * 1000) / 10,
  }));

  return (
    <div className="h-80 w-full border-l-2 border-r-2 border-system-red px-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          barCategoryGap="35%"
        >
          <CartesianGrid
            stroke="var(--color-tertiary-surface)"
            strokeDasharray="3 3"
            horizontal={false}
            vertical={false}
          />

          <XAxis
            type="number"
            domain={[0, 100]}
            tickLine={false}
            axisLine={false}
            tick={{
              fill: "var(--color-default-text)",
              fontSize: 11,
              fontFamily: "var(--font-ibm-plex)",
            }}
            tickFormatter={(value) => `${value}%`}
          />

          <YAxis
            type="category"
            dataKey="label"
            width={140}
            tickLine={false}
            axisLine={false}
            tick={{
              fill: "var(--color-default-text)",
              fontSize: 12,
              fontFamily: "var(--font-ibm-plex)",
            }}
          />

          <Tooltip
            cursor={{ fill: "var(--color-secondary-surface)", opacity: 0.35 }}
            contentStyle={{
              backgroundColor: "var(--color-secondary-surface)",
              border: "1px solid var(--color-default-border)",
              borderRadius: "4px",
              color: "var(--color-default-text)",
              fontSize: 14,
              fontFamily: "var(--font-ibm-plex)",
            }}
            labelStyle={{
              color: "var(--color-default-text)",
              fontSize: 14,
              fontFamily: "var(--font-staatliches)",
              letterSpacing: "0.1rem",
              marginBottom: "4px",
            }}
            formatter={(value, _name, item) => [
              `${Number(value).toFixed(1)}% (${item?.payload?.attempt_count ?? 0} attempts)`,
              "Avg Success Rate",
            ]}
          />

          <Bar
            dataKey="success_percent"
            name="Avg Success Rate"
            fill="var(--color-default-text)"
            barSize={14}
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}