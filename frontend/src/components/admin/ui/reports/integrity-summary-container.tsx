"use client";

import { IntegritySummary } from "./integrity-summary";
import { useIntegritySummary } from "@/hooks/use-reporting";

export function IntegritySummaryContainer() {
  const { data, isLoading, isError, error } = useIntegritySummary();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        {Array.from({ length: 4 }).map((_, i) => (
          
          <div key={i} className="h-36 rounded-lg bg-background/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-36 items-center justify-center rounded-lg border border-system-red">
        <p className="text-sm text-system-red">
          {error instanceof Error ? error.message : "Failed to load integrity summary."}
        </p>
      </div>
    );
  }

  if (!data) return null;

  return <IntegritySummary data={data} />;
}