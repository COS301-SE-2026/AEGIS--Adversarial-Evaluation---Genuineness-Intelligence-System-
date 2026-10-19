"use client"

import { useState, useMemo} from "react";
import { AssessmentAnalyticsTable } from "./assessment-analytics-table";
import { useDashboardTable } from "@/hooks/dashboard-table-hook";
import { assessmentColumns } from "./assessment-analytics-table-columns";
import { Pagination } from "../buttons/pagination";

interface AssessmentAnalyticsTableProps{
    recruiterId: number | null;
}

export function AssessmentAnalyticsTableContainer({
    recruiterId,
}: AssessmentAnalyticsTableProps) {
  const { data, isLoading, isError, error } = useDashboardTable(recruiterId);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(8);
    
    const paginatedItems = useMemo(() => {
        if (!data) return [];

        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return data.items.slice(startIndex, endIndex);
    }, [data, currentPage, itemsPerPage]);

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
                items={paginatedItems}
                columns={assessmentColumns}
                emptyMessage="No assessment analytics available"
            />

            <Pagination
                currentPage={currentPage}
                totalItems={data.items.length}
                itemsPerPage={itemsPerPage}
                onPageChange={setCurrentPage}
                onItemsPerPagechange={setItemsPerPage}
            />
        </div>

        
    )
}