"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/apiClient";
import { getAuthHeaders } from "@/lib/auth";
import type { AssessmentAnalyticsTable } from "@/types/dashboard-types";

export function useDashboardTable(recruiterId: number | null) {
  return useQuery<AssessmentAnalyticsTable>({
    queryKey: ["dashboard-table-assessments", recruiterId],
    enabled: recruiterId !== null,

    queryFn: ({ signal }) => {
      if (recruiterId === null) {
        throw new Error("Recruiter ID is required.");
      }

      return apiGet<AssessmentAnalyticsTable>(
        "/api/v1/admin/dashboard/assessments",
        {
          query: {
            recruiter_id: recruiterId,
            page: 1,
            page_size: 8,
          },
          headers: getAuthHeaders(),
          signal,
        }
      );
    },

    retry: false,
    refetchIntervalInBackground: false,
  });
}