"use client";

import { PolarAngleAxis, RadialBar, RadialBarChart, ResponsiveContainer } from "recharts";
import type { IntegritySummaryResponse } from "@/app/(admin)/types/reporting";

interface GaugeTileProps {
  label: string;
  value: number; // 0.0-1.0
}

function GaugeTile({ label, value }: Readonly<GaugeTileProps>) {
  const percent = Math.round(value * 100);
  const chartData = [{ name: label, value: percent, fill: "var(--color-system-red)" }];

  return (
    <div className="bg-secondary-surface border border-default-border rounded-lg px-4 py-4 flex flex-col items-center">
      <div className="h-28 w-full relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={chartData}
            startAngle={180}
            endAngle={0}
            innerRadius="70%"
            outerRadius="100%"
            barSize={12}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
            <RadialBar dataKey="value" background={{ fill: "var(--color-tertiary-surface)" }} cornerRadius={6} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-end justify-center pb-1">
          <span className="font-staatliches text-2xl text-default-text">{percent}%</span>
        </div>
      </div>
      <p className="font-jetbrains text-[10px] tracking-wider text-default-border uppercase text-center mt-1">
        {label}
      </p>
    </div>
  );
}

interface IntegritySummaryProps {
  data: IntegritySummaryResponse;
}

export function IntegritySummary({ data }: Readonly<IntegritySummaryProps>) {
  return (
    <div className="w-full">
      <h2 className="text-xl tracking-wide mb-1">System Integrity Signals</h2>
      <p className="text-xs text-default-border font-jetbrains mb-4">
        Observed patterns worth reviewing 
      </p>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <GaugeTile label="High Paste-to-Typed Ratio" value={data.pct_responses_elevated_paste_reliance} />
        <GaugeTile label="Assessments Flagged for Review" value={data.pct_assessments_with_elevated_review} />

        <div className="bg-secondary-surface border border-default-border rounded-lg px-4 py-4 flex flex-col justify-center">
          <p className="font-jetbrains text-[10px] tracking-wider text-default-border uppercase">
            Average Focus Loss Count
          </p>
          <p className="font-staatliches text-2xl tracking-wide text-default-text mt-1">
            {data.avg_focus_loss_count.toFixed(1)}
          </p>
        </div>

        <div className="bg-secondary-surface border border-default-border rounded-lg px-4 py-4 flex flex-col justify-center">
          <p className="font-jetbrains text-[10px] tracking-wider text-default-border uppercase">
            Responses Analysed
          </p>
          <p className="font-staatliches text-2xl tracking-wide text-default-text mt-1">
            {data.total_responses_analyzed}
          </p>
        </div>
      </div>
    </div>
  );
}