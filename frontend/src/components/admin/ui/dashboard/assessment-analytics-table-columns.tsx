import Link from "next/link";
import type { AnalyticsTableColumn, AssessmentAnalyticsTableItems } from "@/types/dashboard-types";
import { ReportViewButton } from "@/components/candidate/ui/buttons/report-view-button";

export const assessmentColumns: AnalyticsTableColumn<AssessmentAnalyticsTableItems>[] = [
    {
        key: "id",
        header: "ID",
        render: (assessment) => assessment.assessment_id,
    },
    {
        key: "assessment",
        header: "Assessment",
        render: (assessment) => assessment.name,
    },
    {
        key: "average",
        header: "Average",
        render: (assessment) => `${assessment.average_score_percent.toFixed(2)}%`,
    },
    {
        key: "top-candidate",
        header: "Top Candidate",
        render: (assessment) => assessment.top_candidate_name,
    },
    {
        key: "view",
        header: "View",
        render: (assessment) => (
                <Link
                    href={`/dashboard/assessment/${assessment.assessment_id}`}
                >
                    <ReportViewButton/>
                </Link>
            ),
    },
];