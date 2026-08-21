"use client"

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/apiClient";
import { getAuthHeaders } from "@/lib/auth";
import { DashboardSummaryProps,  } from "@/types/dashboard-types";


export function useDashboardSummary(recruiterId: number | null) {
    return useQuery<DashboardSummaryProps>({
        queryKey: ["dashboard-summary", recruiterId],
        enabled: recruiterId !== null,
        queryFn: ({ signal }) => {
        if (recruiterId === null) {
            throw new Error("Recruiter ID is required.");
        }

        return apiGet<DashboardSummaryProps>(
            "/api/v1/admin/dashboard/summary",
            {
            query: {
                recruiter_id: recruiterId,
            },
            headers: getAuthHeaders(),
            signal,
            }
        );
        },

        refetchInterval: 10_000,
        refetchIntervalInBackground: false,
    });
}