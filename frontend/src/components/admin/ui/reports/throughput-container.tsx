"use client";

import { ThroughputStats } from "./throughput-stats";
import { useThroughput } from "@/hooks/use-reporting";

export function ThroughputContainer() {
  const { data, isLoading, isError, error } = useThroughput();

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {Array.from({ length: 7 }).map((_, i) => (
          
          <div key={i} className="h-24 rounded-lg bg-background/30 animate-pulse" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex h-24 items-center justify-center rounded-lg border border-system-red">
        <p className="text-sm text-system-red">
          {error instanceof Error ? error.message : "Failed to load throughput data."}
        </p>
      </div>
    );
  }

  if (!data) return null;

  return <ThroughputStats data={data} />;
}