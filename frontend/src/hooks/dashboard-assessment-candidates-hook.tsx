"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/apiClient";
import { getAuthHeaders } from "@/lib/auth";
import type { AssessmentDetailTableResponse } from "@/types/dashboard-types";

export function useAssessmentCandidate(assessmentId: number) {
  return useQuery<AssessmentDetailTableResponse>({
    queryKey: ["dashboard-table-candidates", assessmentId],

    enabled: Number.isInteger(assessmentId),

    queryFn: ({ signal }) =>
      apiGet<AssessmentDetailTableResponse>(
        `/api/v1/admin/dashboard/assessments/${assessmentId}/candidates`,
        {
          headers: getAuthHeaders(),
          signal,
          query: {
            page: 1,
            page_size: 8,
          },
        }
      ),

    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
  });
}