"use client"

import type { AnalyticsTableColumn, AnalyticsTableProps } from "@/types/dashboard-types";

//extend the table props to accomodate sorting without breaking base type
type SortableTableProps<T> = AnalyticsTableProps<T> & {
    sortColumn?: string | null;
    sortDirection?: "asc" | "desc";
    onSort?: (key: string) => void;
}

export function AssessmentAnalyticsTable<T>({ items, columns, emptyMessage = "No analytics available", sortColumn, sortDirection, onSort }: Readonly<SortableTableProps<T>>) {

    return (
        <table className="w-full min-w-175 rounded-md overflow-x-auto">
            
            <thead className="text-medium bg-secondary-surface tracking-wide">
                <tr>
                    {columns.map((column: AnalyticsTableColumn<T>) => (
                        <th
                            key={column.key}
                            scope="col"
                            className={`px-4 py-3 ${column.className ?? "text-left"} ${
                                column.sortable ? 'cursor-pointer select-none hover:bg-tertiary-surface/50 transition-colors' : ''
                            }`}
                            onClick={() => column.sortable && onSort && onSort(column.key)}
                        >
                            <div className={`flex items-center gap-2 ${column.className?.includes('center') ? 'justify-center' : 'justify-start'}`}>
                                {column.header}
                                {column.sortable && sortColumn === column.key && (
                                    <span className="text-xs">
                                        {sortDirection === "asc" ? "▲" : "▼"}
                                    </span>
                                )}
                            </div>
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
                                    className={`px-4 py-4 text-sm text-default-text ${column.className ?? "text-left"}`}
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