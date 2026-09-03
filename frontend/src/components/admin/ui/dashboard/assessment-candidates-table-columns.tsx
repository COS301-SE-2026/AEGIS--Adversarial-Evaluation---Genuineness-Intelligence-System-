import Link from "next/link";

import type { AnalyticsTableColumn, AssessmentCandidateResult } from "@/types/dashboard-types";
import { ReportViewButton } from "@/components/candidate/ui/buttons/report-view-button";

export const candidateColumns: AnalyticsTableColumn<AssessmentCandidateResult>[] = [
    {
        key: "candidate",
        header: "Candidate Name",
        render: (candidate) => candidate.candidate_name,
    },
    {
        key: "total-score",
        header: "Total Score",
        render: (candidate) => `${candidate.total_score_percent.toFixed(2)}%`,
    },
    {
        key: "status",
        header: "Status",
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
        key: "ai-rating",
        header: "Integrity Flag Signal",
        render: (candidate) => `${candidate.ai_rating_percent.toFixed()}`,
    },
    {
        key: "answers",
        header: "View Answers",
        render: (candidate) => (
            <Link
              href={`/grade-assessment/${candidate.candidate_assess_id}/metrics`}
            >
                <ReportViewButton/>
            </Link>
        )
    }
]