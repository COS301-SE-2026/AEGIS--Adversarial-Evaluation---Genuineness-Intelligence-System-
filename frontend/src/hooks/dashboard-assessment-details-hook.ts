"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/apiClient";
import { getAuthHeaders } from "@/lib/auth";
import type { AssessmentDetailCardResponse } from "@/types/dashboard-types";

export function useAssessmentDetails(assessmentId: number) {
  return useQuery<AssessmentDetailCardResponse>({
    queryKey: ["dashboard-assessment-details", assessmentId],
    enabled: Number.isInteger(assessmentId),

    queryFn: ({ signal }) =>
      apiGet<AssessmentDetailCardResponse>(
        `/api/v1/admin/dashboard/assessments/${assessmentId}`,
        {
          headers: getAuthHeaders(),
          signal,
        }
      ),

    retry: false,
    refetchIntervalInBackground: false,
  });
}