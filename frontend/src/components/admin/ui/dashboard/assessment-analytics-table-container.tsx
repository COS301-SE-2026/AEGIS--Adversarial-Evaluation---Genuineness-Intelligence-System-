"use client"

import { AssessmentAnalyticsTable } from "./assessment-analytics-table"
import { useDashboardTable } from "@/hooks/dashboard-table-hook"

export function AssessmentAnalyticsTableContainer() {
    const {data, isLoading, isError, error} = useDashboardTable();

    if (isLoading) {
        return (
            <div className="w-full h-64 animate-pulse bg-secondary-surface"/>
        );
    }

    if (isError) {
        return (
            <div className="border border-system-red p-6">
                <p className="text text-sm text-system-red">
                    {error instanceof Error
                        ? error.message
                        : "Failed to load assessment analytics."
                    }
                </p>
            </div>
        )
    }

    if (!data) {
        return null;
    }

    return (
        <div className="w-full">
            <AssessmentAnalyticsTable items={data.items}/>
        </div>
    )
}