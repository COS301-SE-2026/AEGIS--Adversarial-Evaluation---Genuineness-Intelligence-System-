"use client"

import Link from "next/link";
import type { AnalyticsTableProps } from "@/types/dashboard-types";
import { ReportViewButton } from "@/components/candidate/ui/buttons/report-view-button";

export function AssessmentAnalyticsTable<T>({ items, columns, emptyMessage = "No analytics available" }: Readonly<AnalyticsTableProps<T>>) {

    return (
        <table className="w-full min-w-175 rounded-md overflow-x-auto">
            
            <thead className="text-medium bg-secondary-surface tracking-wide">
                <tr>
                    {columns.map((column) => (
                        <th
                            key={column.key}
                            scope="col"
                            className={`px-4 py-3 text-left ${column.className ?? ""}`}
                        >
                            {column.header}
                        </th>
                    ))}
                </tr>
            </thead>

            <tbody className="divide-y divide-default-border">
                {items.length > 0 ? (
                    items.map((item, index) => (
                        <tr
                            key={index}
                            className="hover:bg-tertiary-surface/30"
                        >
                            {columns.map((column) => (
                                <td
                                    key={column.key}
                                    className={`px-4 py-4 text-sm text-default-text ${column.className ?? ""}`}
                                >
                                    {column.render(item)}
                                </td>
                            ))}
                        </tr>
                    ))
                ) : (
                    <tr>
                        <td
                            colSpan={columns.length}
                            className="px-4 py-12 text-center text-sm text-default-border"
                        >
                            {emptyMessage}
                        </td>
                    </tr>
                )}
            </tbody>

        </table>
    )
}