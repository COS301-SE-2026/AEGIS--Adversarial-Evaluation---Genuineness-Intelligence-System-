"use client"

import { AssessmentAnalyticsTable } from "./assessment-analytics-table";
import { useDashboardTable } from "@/hooks/dashboard-table-hook";
import { assessmentColumns } from "./assessment-analytics-table-columns";

interface AssessmentAnalyticsTableProps{
    recruiterId: number | null;
}

export function AssessmentAnalyticsTableContainer({
    recruiterId,
}: AssessmentAnalyticsTableProps) {
  const { data, isLoading, isError, error } = useDashboardTable(recruiterId);

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
            
            <div className="mb-4">
                <h2 className="text-xl tracking-wide">
                    Assessment Performance Table
                </h2>
            </div>
            <AssessmentAnalyticsTable 
                items={data.items}
                columns={assessmentColumns}
                emptyMessage="No assessment analytics available"
            />
        </div>
    )
}