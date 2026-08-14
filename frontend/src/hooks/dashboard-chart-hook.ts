"use client"

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/apiClient";
import { getAuthHeaders } from "@/lib/auth";
import { BarChartData  } from "@/types/dashboard-types";

const BAR_CHART_QUERY_KEY = ["bar-chart-data"];

const MOCK_BAR_CHART_DATA: BarChartData[] = [
    {
        assessment_name: "Java Fundementals",
        average_score_percent: 78.07
    },
     {
        assessment_name: "Python Basics",
        average_score_percent: 60.04
    },
    {
        assessment_name: "Data Structures",
        average_score_percent: 92.10
    },
    {
        assessment_name: "Algorithms",
        average_score_percent: 50.72
    },
    {
        assessment_name: "Algorithms",
        average_score_percent: 50.72
    },
    {
        assessment_name: "Algorithms",
        average_score_percent: 50.72
    },
    {
        assessment_name: "Algorithms",
        average_score_percent: 50.72
    },
    {
        assessment_name: "Algorithms",
        average_score_percent: 50.72
    },
    {
        assessment_name: "Algorithms",
        average_score_percent: 50.72
    },
    {
        assessment_name: "Algorithms",
        average_score_percent: 50.72
    },
    {
        assessment_name: "Lets see",
        average_score_percent: 51.72
    },
    {
        assessment_name: "Algorithms",
        average_score_percent: 50.72
    },
]

export function useBarChartData() {
    return useQuery({
        queryKey: BAR_CHART_QUERY_KEY,
        
        queryFn: async () => {

            //temporary data mock before api is implemented
            return MOCK_BAR_CHART_DATA;
        },
        
        // queryFn: ({ signal }) =>
        //     apiGet<BarChartData[]>(
        //         "/api/v1/admin/dashboard/score-distribution",
        //         {
        //             headers: getAuthHeaders(),
        //             signal // handles cancelled requests
        //         }
        //     ), // the TanStack Query needs a function as the "value" so it control when a request happens

        refetchInterval: 10_000, //polls every 10s
        
        refetchIntervalInBackground: false, //stops polling when user changes tabs
    })
}