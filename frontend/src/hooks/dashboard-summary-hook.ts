"use client"

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/apiClient";
import { getAuthHeaders } from "@/lib/auth";
import { DashboardSummaryProps,  } from "@/types/dashboard-types";


export function useDashboardSummary() {
    return useQuery({
        queryKey: ["dashboard-summary"],
        queryFn: ({ signal }) => 
            apiGet<DashboardSummaryProps>(
                "/api/v1/admin/dashboard/summary",
                 {
                    headers: getAuthHeaders(),
                    signal,
                }
            ),
           
        refetchInterval: 10_000, //polls every 10s
        
        refetchIntervalInBackground: false, //stops polling when user changes tabs
    })
}