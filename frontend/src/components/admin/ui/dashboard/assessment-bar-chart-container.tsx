"use client"

import { AssessmentBarChart } from "./assessment-bar-chart";
import { useBarChartData } from "@/hooks/dashboard-chart-hook";

export function AssessmentBarChartContainer() {
    const {data, isLoading, isError, error, isFetching } = useBarChartData();

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
            <div className="flex h-80 w-full items-center justify-center rounded-lg border-default-border">
                <p className="text-sm text-default-text">
                    No assessments score data available.
                </p>
            </div>
        );
    }

    return (
        <div className="relative">
            <AssessmentBarChart data={data} />

            {isFetching && (
                <span className="absolute right-2 top-2 text-xs text-default-text">
                    Updating
                </span>
            )}
        </div>
    )
}