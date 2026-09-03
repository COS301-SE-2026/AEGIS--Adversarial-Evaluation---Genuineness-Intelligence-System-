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
import type { TrapPatternEffectivenessResponse } from "@/app/(admin)/types/reporting";

interface TrapPatternChartProps {
  data: TrapPatternEffectivenessResponse;
}

export function TrapPatternChart({ data }: Readonly<TrapPatternChartProps>) {
  const chartData = [...data.patterns]
    .map((p) => ({ ...p, bait_taken_percent: Math.round(p.bait_taken_rate * 1000) / 10 }))
    .sort((a, b) => b.bait_taken_percent - a.bait_taken_percent);

  return (
    <div className="h-80 w-full border-l-2 border-r-2 border-system-red px-3">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={chartData}
          layout="vertical"
          margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
          barCategoryGap="30%"
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
            tickFormatter={(v) => `${v}%`}
          />

          <YAxis
            type="category"
            dataKey="pattern_used"
            width={170}
            tickLine={false}
            axisLine={false}
            tick={{
              fill: "var(--color-default-text)",
              fontSize: 11,
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
            }}
            formatter={(value, _name, item) => [
              `${Number(value).toFixed(1)}% bait taken (${item?.payload?.bait_taken_count ?? 0}/${
                item?.payload?.times_deployed ?? 0
              } deployments)`,
              "Bait Taken Rate",
            ]}
          />

          <Bar
            dataKey="bait_taken_percent"
            name="Bait Taken Rate"
            fill="var(--color-system-red)"
            barSize={14}
            radius={[0, 4, 4, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}