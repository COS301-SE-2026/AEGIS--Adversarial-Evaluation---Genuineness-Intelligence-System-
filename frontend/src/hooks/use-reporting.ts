"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "@/lib/apiClient";
import { getAuthHeaders } from "@/lib/auth";
import type {
  QuestionQualityResponse,
  PerformanceBreakdownResponse,
  BreakdownBy,
  ThroughputResponse,
  ScoreTrendResponse,
  ScoreTrendGranularity,
  TrapPatternEffectivenessResponse,
  IntegritySummaryResponse,
  IntegrityScoreAverageResponse,
} from "@/app/(admin)/types/reporting";
import {
  MOCK_QUESTION_QUALITY,
  MOCK_PERFORMANCE_BREAKDOWN,
  MOCK_THROUGHPUT,
  MOCK_SCORE_TREND,
  MOCK_TRAP_PATTERN_EFFECTIVENESS,
  MOCK_INTEGRITY_SUMMARY,
} from "@/lib/mockReportingData";


const USE_MOCK_REPORTING_DATA = false;

const MOCK_LATENCY_MS = 300;

function mockDelay<T>(value: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), MOCK_LATENCY_MS));
}

export function useQuestionQuality() {
  return useQuery({
    queryKey: ["reporting", "question-quality"],
    queryFn: async (): Promise<QuestionQualityResponse> => {
      if (USE_MOCK_REPORTING_DATA) {
        return mockDelay(MOCK_QUESTION_QUALITY);
      }
      return apiGet<QuestionQualityResponse>("/api/v1/reporting/question-quality", {
        headers: getAuthHeaders(),
      });
    },
  });
}

export function usePerformanceBreakdown(by: BreakdownBy) {
  return useQuery({
    queryKey: ["reporting", "performance-breakdown", by],
    queryFn: async (): Promise<PerformanceBreakdownResponse> => {
      if (USE_MOCK_REPORTING_DATA) {
        return mockDelay(MOCK_PERFORMANCE_BREAKDOWN[by]);
      }
      return apiGet<PerformanceBreakdownResponse>("/api/v1/reporting/performance-breakdown", {
        headers: getAuthHeaders(),
        query: { by },
      });
    },
  });
}

export function useThroughput() {
  return useQuery({
    queryKey: ["reporting", "throughput"],
    queryFn: async (): Promise<ThroughputResponse> => {
      if (USE_MOCK_REPORTING_DATA) {
        return mockDelay(MOCK_THROUGHPUT);
      }
      return apiGet<ThroughputResponse>("/api/v1/reporting/throughput", {
        headers: getAuthHeaders(),
      });
    },
  });
}

export function useScoreTrend(granularity: ScoreTrendGranularity) {
  return useQuery({
    queryKey: ["reporting", "score-trend", granularity],
    queryFn: async (): Promise<ScoreTrendResponse> => {
      if (USE_MOCK_REPORTING_DATA) {
        return mockDelay(MOCK_SCORE_TREND[granularity]);
      }
      return apiGet<ScoreTrendResponse>("/api/v1/reporting/score-trend", {
        headers: getAuthHeaders(),
        query: { granularity },
      });
    },
  });
}

export function useTrapPatternEffectiveness() {
  return useQuery({
    queryKey: ["reporting", "trap-pattern-effectiveness"],
    queryFn: async (): Promise<TrapPatternEffectivenessResponse> => {
      if (USE_MOCK_REPORTING_DATA) {
        return mockDelay(MOCK_TRAP_PATTERN_EFFECTIVENESS);
      }
      return apiGet<TrapPatternEffectivenessResponse>("/api/v1/reporting/trap-pattern-effectiveness", {
        headers: getAuthHeaders(),
      });
    },
  });
}

export function useIntegritySummary() {
  return useQuery({
    queryKey: ["reporting", "integrity-summary"],
    queryFn: async (): Promise<IntegritySummaryResponse> => {
      if (USE_MOCK_REPORTING_DATA) {
        return mockDelay(MOCK_INTEGRITY_SUMMARY);
      }
      return apiGet<IntegritySummaryResponse>("/api/v1/reporting/integrity-summary", {
        headers: getAuthHeaders(),
      });
    },
  });
}

export function useIntegrityScoreAverage() {
  return useQuery({
    queryKey: ["reporting", "integrity-score-average"],
    queryFn: async (): Promise<IntegrityScoreAverageResponse> => {
      return apiGet<IntegrityScoreAverageResponse>(
        "/api/v1/reporting/integrity-score-average",
        {
          headers: getAuthHeaders(),
        },
      );
    },
  });
}