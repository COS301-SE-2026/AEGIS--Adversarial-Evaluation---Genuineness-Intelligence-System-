"use client"

import { AssessmentBarChart } from "./assessment-bar-chart";
import { useBarChartData } from "@/hooks/dashboard-chart-hook";

interface AssessmentBarChartProps {
    recruiterId: number | null;
}

export function AssessmentBarChartContainer({
    recruiterId,
}: Readonly<AssessmentBarChartProps>) {
    const {data, isLoading, isError, error, isFetching } = useBarChartData(recruiterId);

    if (isLoading) {
        return ( 
            <div className="h-80 w-full animate-pulse rounded-lg bg-background/30"/>
        );
    }

    if (isError) {
        return (
            <div
                className="flex h-80 items-center justify-center rounded-lg border border-system-red"
            >
                <p className="text-sm text-system-red">
                    {error instanceof Error ?
                        error.message :
                        "Failed to load assessment scores."
                    }
                </p>
            </div>
        )
    }

if (!data || data.length === 0) {
  return (
    <div className="relative mt-16">
      <div className="mb-4">
        <h2 className="text-xl tracking-wide">
          Assessment Performance Chart
        </h2>
      </div>

      <div className="relative h-80 w-full overflow-hidden border-l-2 border-r-2 border-system-red px-3">
        <div className="absolute inset-0 flex flex-col justify-between py-6 opacity-30">
          <div className="border-t border-default-border" />
          <div className="border-t border-default-border" />
          <div className="border-t border-default-border" />
          <div className="border-t border-default-border" />
          <div className="border-t border-default-border" />
        </div>

        <div className="absolute bottom-0 left-3 right-3 border-b border-default-border" />

        <div className="relative flex h-full items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-end justify-center gap-1 opacity-40">
              <span className="h-5 w-2 bg-default-border" />
              <span className="h-8 w-2 bg-default-border" />
              <span className="h-12 w-2 bg-default-border" />
              <span className="h-7 w-2 bg-default-border" />
            </div>

            <p className="text-sm text-default-text">
              No assessment score data available
            </p>
            <p className="mt-1 text-xs text-default-border">
              Completed assessments will appear here.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

    return (
        <div className="relative mt-16">

            <AssessmentBarChart data={data} />

            {isFetching && (
                <span className="absolute right-2 top-2 text-xs text-default-border">
                    Updating
                </span>
            )}
        </div>
    )
}