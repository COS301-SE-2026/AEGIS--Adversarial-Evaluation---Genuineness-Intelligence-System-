import Link from "next/link";

import type { AnalyticsTableColumn, AssessmentCandidateResult } from "@/types/dashboard-types";
import type { ReviewBand } from "@/app/(admin)/types/metrics";
import { ReportViewButton } from "@/components/candidate/ui/buttons/report-view-button";

const INTEGRITY_BAND_META: Record<ReviewBand, { label: string; color: string }> = {
    low: { label: "Low", color: "var(--color-status-success, #4ade80)" },
    medium: { label: "Medium", color: "var(--color-warning, #fbbf24)" },
    high: { label: "High", color: "var(--color-system-red, #ef4444)" },
};

function renderIntegrity(candidate: AssessmentCandidateResult) {
    if (candidate.integrity_score === null || candidate.integrity_band === null) {
        return <span className="text-default-text/50">Not yet computed</span>;
    }

    const meta = INTEGRITY_BAND_META[candidate.integrity_band];

    return (
        <span style={{color: meta.color}} className="font-medium">
            {candidate.integrity_score}
        </span>
    );
}

export const candidateColumns: AnalyticsTableColumn<AssessmentCandidateResult>[] = [
    {
        key: "candidate",
        header: "Candidate Name",
        
        render: (candidate) => candidate.candidate_name,
    },
    {
        key: "total-score",
        header: "Total Score",
        className: "text-center",
        render: (candidate) => `${candidate.total_score_percent.toFixed(0)}%`,
    },
    {
        key: "status",
        header: "Status",
        sortable: true,
        className: "text-center",
        render: (candidate) => (
            <span
                className={
                    candidate.status === "PASS"
                    ? "text-status-success"
                    : "text-status-error"
                }
            >
                {candidate.status}
            </span>
        )
    },
    {
        key: "integrity",
        header: "Integrity Risk Score",
        sortable: true,
        className: "text-center",
        render: renderIntegrity,
       
    },
    {
        key: "answers",
        header: "View Answers",
        className: "md:text-center",
        render: (candidate) => (
            <Link
              href={`/reports/${candidate.candidate_assess_id}/metrics`}
            >
                <ReportViewButton/>
            </Link>
        )
    }
]