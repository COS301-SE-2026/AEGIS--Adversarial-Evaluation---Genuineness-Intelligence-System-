"use client";

import { useState } from "react";
import { PerformanceBreakdownChart } from "./performance-breakdown-chart";
import { usePerformanceBreakdown } from "@/hooks/use-reporting";
import type { BreakdownBy } from "@/app/(admin)/types/reporting";

const TABS: { key: BreakdownBy; label: string }[] = [
  { key: "category", label: "Category" },
  { key: "difficulty", label: "Difficulty" },
  { key: "adversarial", label: "Adversarial" },
];

export function PerformanceBreakdownContainer() {
  const [by, setBy] = useState<BreakdownBy>("category");
  const { data, isLoading, isError, error, isFetching } = usePerformanceBreakdown(by);

  return (
    <div className="w-full">
      <div className="flex items-start justify-between gap-4 mb-4 flex-wrap">
        <h2 className="text-xl tracking-wide">Performance Breakdown</h2>

        <div className="flex gap-1 bg-tertiary-surface/40 border border-default-border rounded-lg p-1">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setBy(tab.key)}
              className={`font-staatliches text-xs sm:text-sm tracking-wider uppercase px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                by === tab.key
                  ? "bg-default-text text-background"
                  : "text-default-text/60 hover:text-default-text"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="h-80 w-full animate-pulse rounded-lg bg-background/30" />
      ) : isError ? (
        <div className="flex h-80 items-center justify-center rounded-lg border border-system-red">
          <p className="text-sm text-system-red">
            {error instanceof Error ? error.message : "Failed to load performance breakdown."}
          </p>
        </div>
      ) : !data || data.slices.length === 0 ? (
        <div className="flex h-80 flex-col items-center justify-center text-center rounded-lg border border-default-border bg-secondary-surface">
          <p className="text-sm text-default-text">No performance data available</p>
          <p className="mt-1 text-xs text-default-border">
            Try a different breakdown or check back once more candidates finish.
          </p>
        </div>
      ) : (
        <div className="relative">
          <PerformanceBreakdownChart data={data} />
          {isFetching && (
            <span className="absolute right-2 top-2 text-xs text-default-border">Updating</span>
          )}
        </div>
      )}
    </div>
  );
}