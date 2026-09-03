"use client";

import { Legend, Pie, PieChart, ResponsiveContainer, Sector, Tooltip } from "recharts";
import type { PieSectorShapeProps } from "recharts";
import type {
  QuestionQualityBucketKey,
  QuestionQualityResponse,
} from "@/app/(admin)/types/reporting";

const BUCKET_META: Record<QuestionQualityBucketKey, { label: string; color: string }> = {
  needs_revision: { label: "Needs Revision", color: "var(--color-system-red)" },
  balanced: { label: "Balanced", color: "var(--color-status-success)" },
  too_easy: { label: "Too Easy", color: "var(--color-status-info)" },
  thin_sample: { label: "Thin Sample", color: "var(--color-status-warning)" },
};

type LegendEntry = {
  value?: string;
  color?: string;
  payload?: {
    color?: string;
  };
};

type LegendProps = {
  payload?: LegendEntry[];
};

function QuestionQualitySlice(props: PieSectorShapeProps) {
  const payload = props.payload as { color?: string } | undefined;
  return (
    <Sector
      {...props}
      fill={payload?.color ?? props.fill}
      stroke="var(--color-secondary-surface)"
    />
  );
}

interface QuestionQualityDonutProps {
  data: QuestionQualityResponse;
}

export function QuestionQualityDonut({ data }: Readonly<QuestionQualityDonutProps>) {
  const chartData = data.buckets.map((b) => ({
    ...b,
    label: BUCKET_META[b.bucket].label,
    color: BUCKET_META[b.bucket].color,
  }));

  const renderLegend = (props: LegendProps) => {
    const { payload } = props;

    return (
      <ul className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        {payload?.map((entry) => {
          const color = entry.payload?.color ?? entry.color;
          return (
            <li
              key={entry.value}
              className="flex items-center gap-2 text-xs text-default-text"
            >
              <span
                className="inline-block h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span>{entry.value}</span>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="w-full">
      <div className="mb-4">
        <h2 className="text-xl tracking-wide">Question Quality</h2>
        <p className="text-xs text-default-border font-jetbrains mt-1">
          {data.total_questions_answered} questions answered across all assessments
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-6 items-center">
        <div className="h-64 w-full sm:w-1/2">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                dataKey="count"
                nameKey="label"
                innerRadius={55}
                outerRadius={90}
                paddingAngle={2}
                shape={QuestionQualitySlice}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "var(--color-secondary-surface)",
                  border: "1px solid var(--color-default-border)",
                  borderRadius: "4px",
                  fontFamily: "var(--font-ibm-plex)",
                  fontSize: 13,
                }}
                formatter={(value, _name, item) => {
                  const count = Number(value ?? 0);
                  const label = (item?.payload as { label?: string } | undefined)?.label ?? "";
                  return [`${count} question${count === 1 ? "" : "s"}`, label];
                }}
              />
              <Legend
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{ fontFamily: "var(--font-ibm-plex)", fontSize: 12 }}
                content={(props) => renderLegend(props as LegendProps)}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="w-full sm:w-1/2 space-y-2">
          <h3 className="font-jetbrains text-[10px] tracking-wider text-default-border uppercase">
            Guidance
          </h3>
          {data.guidance.length === 0 ? (
            <p className="text-sm text-default-text/60">No guidance available yet.</p>
          ) : (
            <ul className="space-y-2">
              {data.guidance.map((g) => (
                <li
                  key={g}
                  className="text-sm text-default-text bg-tertiary-surface/40 border border-default-border rounded px-3 py-2"
                >
                  {g}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}