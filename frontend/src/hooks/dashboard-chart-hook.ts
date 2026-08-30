"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/apiClient";
import { getAuthHeaders } from "@/lib/auth";
import type {
  BarChartData,
  DashboardGraphResponse,
} from "@/types/dashboard-types";

export function useBarChartData(recruiterId: number | null) {
  return useQuery<BarChartData[]>({
    queryKey: ["bar-chart-data", recruiterId],
    enabled: recruiterId !== null,

    queryFn: async ({ signal }) => {
      if (recruiterId === null) {
        throw new Error("Recruiter ID is required.");
      }

      const response = await apiGet<DashboardGraphResponse>(
        "/api/v1/admin/dashboard/score-distribution",
        {
          query: {
            recruiter_id: recruiterId,
          },
          headers: getAuthHeaders(),
          signal,
        }
      );

      return response.bars.map((bar) => ({
        assessment_name: bar.assessment_name,
        average_score_percent: bar.average_score,
      }));
    },

    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });
}