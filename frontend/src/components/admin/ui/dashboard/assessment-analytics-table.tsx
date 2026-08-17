"use client"

import Link from "next/link";
import type { AssessmentAnalyticsTableItems } from "@/types/dashboard-types";
import { ReportViewButton } from "@/components/candidate/ui/buttons/report-view-button";

interface AssessmentAnalyticsTableProps {
    items: AssessmentAnalyticsTableItems[];
}

export function AssessmentAnalyticsTable({ items }: Readonly<AssessmentAnalyticsTableProps>) {

    return (
        <table className="w-full min-w-175 rounded-md overflow-x-auto">
            
            <thead className="text-medium bg-secondary-surface tracking-wide">
                <tr>
                    <th 
                        scope="col"
                        className="px-4 py-3 text-left"
                    >
                        ID
                    </th>
                    <th 
                        scope="col"
                        className="px-4 py-3 text-left"
                    >
                        Assessment
                    </th>
                    
                    <th 
                        scope="col"
                        className="px-4 py-3 text-left"
                    >
                        Average
                    </th>

                    <th 
                        scope="col"
                        className="px-4 py-3 text-left"
                    >
                        Top Candidate
                    </th>
                    <th 
                        scope="col"
                        className="px-4 py-3 text-left"
                    >
                        View
                    </th>
                </tr>
            </thead>

            <tbody className="divide-y divide-default-border">
                {items.length > 0 ? (
                    items.map((assessment) => (
                        <tr
                            key={assessment.assessment_id}
                            className="hover:bg-tertiary-surface/30"
                        >
                            <td className="px-4 py-4 text-sm text-default-text">
                                {assessment.assessment_id}
                            </td>
                            <td className="px-4 py-4 text-sm text-default-text">
                                {assessment.name}
                            </td>
                            <td className="px-4 py-4 text-sm text-default-text">
                                {assessment.average_score_percent.toFixed(2)} %
                            </td>
                            <td className="px-4 py-4 text-sm text-default-text">
                                {assessment.top_candidate_name}
                            </td>
                            <td className="px-4 py-4 text-sm text-default-text">
                                <Link href={`/dashboard/assessment/${assessment.assessment_id}`}>
                                    <ReportViewButton/>
                                </Link>
                            </td>
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td
                            colSpan={4}
                            className="px-4 py-12 text-center text-sm text-default-border"
                        >
                            No assessmnet analytics available.
                        </td>
                    </tr>
                )}
            </tbody>

        </table>
    )
}