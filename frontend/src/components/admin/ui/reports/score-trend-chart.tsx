"use client";

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ScoreTrendResponse } from "@/app/(admin)/types/reporting";

interface ScoreTrendChartProps {
  data: ScoreTrendResponse;
}

export function ScoreTrendChart({ data }: Readonly<ScoreTrendChartProps>) {
  return (
    <div className="h-80 w-full border-l-2 border-r-2 border-system-red px-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data.points} margin={{ top: 15, right: 20, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="scoreTrendStroke" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="var(--color-system-red)" stopOpacity={0.45} />
              <stop offset="100%" stopColor="var(--color-system-red)" stopOpacity={1} />
            </linearGradient>
          </defs>

          <CartesianGrid stroke="var(--color-tertiary-surface)" strokeDasharray="3 3" vertical={false} />

          <XAxis
            dataKey="period_label"
            tickLine={false}
            axisLine={false}
            tick={{
              fill: "var(--color-default-text)",
              fontSize: 11,
              fontFamily: "var(--font-ibm-plex)",
            }}
          />

          <YAxis
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

          <Tooltip
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
              `${Number(value).toFixed(1)}% (n=${item?.payload?.completed_count ?? 0})`,
              "Avg Score",
            ]}
          />

          <Line
            type="monotone"
            dataKey="avg_score"
            name="Avg Score"
            stroke="url(#scoreTrendStroke)"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "var(--color-system-red)" }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}