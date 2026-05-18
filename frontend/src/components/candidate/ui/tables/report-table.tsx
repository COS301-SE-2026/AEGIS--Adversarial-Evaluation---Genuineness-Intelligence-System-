import Link from "next/link";
import { AssessmentCardProps } from "../cards/assessment-card.types";
import { ReportViewButton } from "../buttons/report-view-button";
import { mockCompletedAssessments } from "@/lib/mockData";

interface ReportTableProps {
    assessments?: (AssessmentCardProps & { dateCompleted?: string })[];
}

export function ReportTable({ assessments = mockCompletedAssessments }: ReportTableProps) {
    const isIncomplete = (grade: number) => grade === 0;

    return (
        <table className="border border-default-border w-full rounded-md overflow-hidden">
            <thead className="font-ibm-plex text-medium bg-[#161719] h-12">
                <tr>
                    <th className="text-left px-6 py-4">Test Name</th>
                    <th className="text-left px-6 py-4">Date Completed</th>
                    <th className="text-left px-6 py-4">Grade</th>
                    <th className="text-left px-6 py-4">View Results</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-default-border">
                {assessments.map((assessment) => (
                    <tr key={assessment.assessmentId} className={isIncomplete(assessment.success_rate) ? "bg-opacity-5" : ""}>
                        <td className={`px-6 py-4 ${isIncomplete(assessment.success_rate) ? "text-yellow-400" : ""}`}>
                            {assessment.title}
                        </td>
                        <td className={`px-6 py-4 ${isIncomplete(assessment.success_rate) ? "text-yellow-400" : ""}`}>
                            {assessment.dateCompleted || "12/05/2026"}
                        </td>
                        <td className={`px-6 py-4 ${isIncomplete(assessment.success_rate) ? "text-yellow-400" : ""}`}>
                            {assessment.success_rate}%
                        </td>
                        <td className="px-6 py-4">
                            <Link href={`/assessment/${assessment.assessmentId}`}>
                                <ReportViewButton />
                            </Link>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    )
}