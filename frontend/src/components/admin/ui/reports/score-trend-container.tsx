"use client";

import { useState } from "react";
import { ScoreTrendChart } from "./score-trend-chart";
import { useScoreTrend } from "@/hooks/use-reporting";
import type { ScoreTrendGranularity } from "@/app/(admin)/types/reporting";

const GRANULARITIES: { key: ScoreTrendGranularity; label: string }[] = [
  { key: "week", label: "Weekly" },
  { key: "month", label: "Monthly" },
];

export function ScoreTrendContainer() {
  const [granularity, setGranularity] = useState<ScoreTrendGranularity>("week");
  const { data, isLoading, isError, error, isFetching } = useScoreTrend(granularity);

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <h2 className="text-xl tracking-wide">Score Trend</h2>

        <div className="flex gap-1 bg-tertiary-surface/40 border border-default-border rounded-lg p-1">
          {GRANULARITIES.map((g) => (
            <button
              key={g.key}
              type="button"
              onClick={() => setGranularity(g.key)}
              className={`font-staatliches text-xs sm:text-sm tracking-wider uppercase px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                granularity === g.key
                  ? "bg-default-text text-background"
                  : "text-default-text/60 hover:text-default-text"
              }`}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-80 w-full animate-pulse rounded-lg bg-background/30" />
      ) : isError ? (
        <div className="flex h-80 items-center justify-center rounded-lg border border-system-red">
          <p className="text-sm text-system-red">
            {error instanceof Error ? error.message : "Failed to load score trend."}
          </p>
        </div>
      ) : !data || data.points.length === 0 ? (
        <div className="flex h-80 flex-col items-center justify-center text-center rounded-lg border border-default-border bg-secondary-surface">
          <p className="text-sm text-default-text">No score trend data available</p>
          <p className="mt-1 text-xs text-default-border">
            Completed assessments will populate this chart over time.
          </p>
        </div>
      ) : (
        <div className="relative">
          <ScoreTrendChart data={data} />
          {isFetching && (
            <span className="absolute right-2 top-2 text-xs text-default-border">Updating</span>
          )}
        </div>
      )}
    </div>
  );
}