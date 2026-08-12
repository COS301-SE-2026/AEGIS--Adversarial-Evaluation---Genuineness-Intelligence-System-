"use client"

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/apiClient";
import { getAuthHeaders } from "@/lib/auth";
import { BarChartData  } from "@/types/dashboard-types";

const BAR_CHART_QUERY_KEY = ["bar-chart-data"];

export function useBarChartData() {
    return useQuery({
        queryKey: BAR_CHART_QUERY_KEY,
        
        queryFn: ({ signal }) =>
            apiGet<BarChartData[]>(
                "/api/v1/admin/dashboard/score-distribution",
                {
                    headers: getAuthHeaders(),
                    signal // handles cancelled requests
                }
            ), // the TanStack Query needs a function as the "value" so it control when a request happens

        refetchInterval: 10_000, //polls every 10s
        
        refetchIntervalInBackground: false, //stops polling when user changes tabs
    })
}