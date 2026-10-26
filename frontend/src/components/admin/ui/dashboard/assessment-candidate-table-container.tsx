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

    const [sortColumn, setSortColumn] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

    const handleSort = (columnKey: string) => {
        if (sortColumn === columnKey) {
            setSortDirection(sortDirection === "asc" ? "desc" : "asc");
        } else {
            setSortColumn(columnKey);
            setSortDirection("asc");
        }
        setCurrentPage(1);
    }

    const sortingAndPaginatedItems = useMemo(() => {
        if (!data) return [];

        let sortedItems = [...data.items];

        if (sortColumn) {
            sortedItems.sort((a, b) => {
                let aValue: number | string;
                let bValue: number | string;

                if (sortColumn === "status") {
                    aValue = a.status;
                    bValue = b.status;
                } else if (sortColumn === "integrity") {
                    aValue = a.integrity_score ?? -1;
                    bValue = b.integrity_score ?? -1;
                } else {
                    return 0
                }

                if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
                if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;

                return 0;
            });
        }

        //pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return sortedItems.slice(startIndex, endIndex);
        
    }, [data, currentPage, itemsPerPage, sortColumn, sortDirection]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center w-full h-64">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-t-default-text"/>
            </div>

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
                items={sortingAndPaginatedItems}
                columns={candidateColumns}
                emptyMessage="No candidates have completed this assessment"
                sortColumn={sortColumn}
                sortDirection={sortDirection}
                onSort={handleSort}
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