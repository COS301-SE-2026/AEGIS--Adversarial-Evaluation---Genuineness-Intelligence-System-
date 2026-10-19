"use client"

import { useState, useMemo} from "react";
import { AssessmentAnalyticsTable } from "./assessment-analytics-table";
import { candidateColumns } from "./assessment-candidates-table-columns";
import { useAssessmentCandidate } from "@/hooks/dashboard-assessment-candidates-hook"
import { Pagination } from "../buttons/pagination";

interface AssessmentCandidateTableContainerProps {
    assessmentId: number;
}

export function AssessmentCandidateTableContainer({ assessmentId }: Readonly<AssessmentCandidateTableContainerProps>) {
    const { data, isLoading, isError, error } = useAssessmentCandidate(assessmentId);

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
                <p className="text-sm text-system-red">
                    {error instanceof Error
                        ? error.message
                        : "Failed to load candidate results"
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
                    Candidate Results
                </h2>
            </div>

            <AssessmentAnalyticsTable
                items={data.items}
                columns={candidateColumns}
                emptyMessage="No candidates have completed this assessment"
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