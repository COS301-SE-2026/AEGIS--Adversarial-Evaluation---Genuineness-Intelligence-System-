"use client";

import { TrapPatternChart } from "./trap-pattern-chart";
import { useTrapPatternEffectiveness } from "@/hooks/use-reporting";

export function TrapPatternContainer() {
  const { data, isLoading, isError, error } = useTrapPatternEffectiveness();

  return (
    <div className="w-full">
      <h2 className="text-xl tracking-wide mb-4">Trap Pattern Effectiveness</h2>

      {isLoading ? (
        <div className="h-80 w-full animate-pulse rounded-lg bg-background/30" />
      ) : isError ? (
        <div className="flex h-80 items-center justify-center rounded-lg border border-system-red">
          <p className="text-sm text-system-red">
            {error instanceof Error ? error.message : "Failed to load trap pattern data."}
          </p>
        </div>
      ) : !data || data.patterns.length === 0 ? (
        <div className="flex h-80 flex-col items-center justify-center text-center rounded-lg border border-default-border bg-secondary-surface">
          <p className="text-sm text-default-text">No adversarial pattern data available</p>
          <p className="mt-1 text-xs text-default-border">
            Deploy adversarial questions to see pattern effectiveness here.
          </p>
        </div>
      ) : (
        <TrapPatternChart data={data} />
      )}
    </div>
  );
}