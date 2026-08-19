"use client"

import { AssessmentAnalyticsTable } from "./assessment-analytics-table";
import { candidateColumns } from "./assessment-candidates-table-columns";
import { useAssessmentCandidate } from "@/hooks/dashboard-assessment-candidates-hook"

interface AssessmentCandidateTableContainerProps {
    assessmentId: number;
}

export function AssessmentCandidateTableContainer({ assessmentId }: Readonly<AssessmentCandidateTableContainerProps>) {
    const { data, isLoading, isError, error } = useAssessmentCandidate(assessmentId);

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

        </div>
    )
}