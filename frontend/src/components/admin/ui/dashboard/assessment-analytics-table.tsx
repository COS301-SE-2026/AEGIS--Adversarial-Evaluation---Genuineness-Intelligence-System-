"use client"

import Link from "next/link";
import type { AssessmentAnalyticsTableItems } from "@/types/dashboard-types";
import { ReportViewButton } from "@/components/candidate/ui/buttons/report-view-button";

interface AssessmentAnalyticsTableProps {
    items: AssessmentAnalyticsTableItems[];
}

export function AssessmentAnalyticsTable({ items }: Readonly<AssessmentAnalyticsTableProps>) {

    return (
        <div className="w-full overflow-x-auto border border-default-border rounded-lg">

            <table className="w-full min-w-175 border-collapse">
                
                <thead>
                    <tr className="border-b border-default-border bg-secondary-surface">
                        <th 
                            scope="col"
                            className="px-4 py-3 text-left  tracking-wide text-default-text"
                        >
                            ID
                        </th>
                        <th 
                            scope="col"
                            className="px-4 py-3 text-left  tracking-wide text-default-text"
                        >
                            Assessment
                        </th>
                        
                        <th 
                            scope="col"
                            className="px-4 py-3 text-left  tracking-wide text-default-text"
                        >
                            Average Score
                        </th>

                        <th 
                            scope="col"
                            className="px-4 py-3 text-left tracking-wide text-default-text"
                        >
                            Top Candidate
                        </th>
                        <th 
                            scope="col"
                            className="px-4 py-3 text-left tracking-wide text-default-text"
                        >
                            View
                        </th>
                    </tr>
                </thead>

                <tbody>
                    {items.length > 0 ? (
                        items.map((assessment) => (
                            <tr
                                key={assessment.assessment_id}
                                className="border-b border-default-border last:border-b-0 transition-colors hover:bg-tertiary-surface"
                            >
                                <td className="px-4 py-4 text-sm text-default-text">
                                    {assessment.assessment_id}
                                </td>
                                <td className="px-4 py-4 text-sm text-default-text">
                                    {assessment.name}
                                </td>
                                <td className="px-4 py-4 text-sm text-default-text">
                                    {assessment.average_score_percent}
                                </td>
                                <td className="px-4 py-4 text-sm text-default-text">
                                    {assessment.top_candidate_name}
                                </td>
                                <td className="px-4 py-4 text-sm text-default-text">
                                    <Link href={`/dashbaord/assessment/${assessment.assessment_id}`}>
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

        </div>
    )
}