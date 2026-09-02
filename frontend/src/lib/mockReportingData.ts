import type {
  QuestionQualityResponse,
  PerformanceBreakdownResponse,
  BreakdownBy,
  ThroughputResponse,
  ScoreTrendResponse,
  ScoreTrendGranularity,
  TrapPatternEffectivenessResponse,
  IntegritySummaryResponse,
} from "@/app/(admin)/types/reporting";

// Question Quality
export const MOCK_QUESTION_QUALITY: QuestionQualityResponse = {
  total_questions_answered: 42,
  buckets: [
    { bucket: "needs_revision", count: 6, question_ids: [12, 18, 24, 31, 37, 40] },
    {
      bucket: "balanced",
      count: 24,
      question_ids: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 19, 20, 21, 22, 23, 25, 26, 27],
    },
    { bucket: "too_easy", count: 8, question_ids: [28, 29, 30, 32, 33, 34, 35, 36] },
    { bucket: "thin_sample", count: 4, question_ids: [38, 39, 41, 42] },
  ],
  guidance: [
    "6 questions have fallen below 30% success and may be too difficult or ambiguously worded.",
    "8 questions exceed 95% success — consider raising their difficulty or retiring them from active rotation.",
    "4 questions have fewer than 3 total attempts — results are not yet statistically meaningful.",
  ],
};

//Performance Breakdown 
export const MOCK_PERFORMANCE_BREAKDOWN: Record<BreakdownBy, PerformanceBreakdownResponse> = {
  category: {
    by: "category",
    slices: [
      { label: "Algorithm", avg_success_rate: 0.62, attempt_count: 138 },
      { label: "Debugging", avg_success_rate: 0.48, attempt_count: 96 },
      { label: "System Design", avg_success_rate: 0.55, attempt_count: 41 },
      { label: "SQL Trap", avg_success_rate: 0.33, attempt_count: 52 },
      { label: "API Design", avg_success_rate: 0.71, attempt_count: 28 },
    ],
  },
  difficulty: {
    by: "difficulty",
    slices: [
      { label: "Easy", avg_success_rate: 0.84, attempt_count: 120 },
      { label: "Medium", avg_success_rate: 0.58, attempt_count: 165 },
      { label: "Hard", avg_success_rate: 0.31, attempt_count: 70 },
    ],
  },
  adversarial: {
    by: "adversarial",
    slices: [
      { label: "Standard", avg_success_rate: 0.69, attempt_count: 210 },
      { label: "Adversarial", avg_success_rate: 0.41, attempt_count: 145 },
    ],
  },
};

//  Throughput
export const MOCK_THROUGHPUT: ThroughputResponse = {
  total_assessments: 14,
  active_count: 6,
  completed_count: 5,
  expired_count: 1,
  avg_time_to_completion_seconds: 2415,
  avg_score: 64.2,
  completion_rate: 0.83,
};

//Score Trend
export const MOCK_SCORE_TREND: Record<ScoreTrendGranularity, ScoreTrendResponse> = {
  week: {
    granularity: "week",
    points: [
      { period_label: "2026-W27", period_start: "2026-06-29", avg_score: 58.2, completed_count: 9 },
      { period_label: "2026-W28", period_start: "2026-07-06", avg_score: 61.4, completed_count: 12 },
      { period_label: "2026-W29", period_start: "2026-07-13", avg_score: 59.8, completed_count: 8 },
      { period_label: "2026-W30", period_start: "2026-07-20", avg_score: 63.1, completed_count: 14 },
      { period_label: "2026-W31", period_start: "2026-07-27", avg_score: 66.7, completed_count: 11 },
      { period_label: "2026-W32", period_start: "2026-08-03", avg_score: 64.9, completed_count: 15 },
    ],
  },
  month: {
    granularity: "month",
    points: [
      { period_label: "2026-04", period_start: "2026-04-01", avg_score: 55.6, completed_count: 34 },
      { period_label: "2026-05", period_start: "2026-05-01", avg_score: 60.3, completed_count: 41 },
      { period_label: "2026-06", period_start: "2026-06-01", avg_score: 62.8, completed_count: 38 },
      { period_label: "2026-07", period_start: "2026-07-01", avg_score: 65.1, completed_count: 45 },
    ],
  },
};

// Trap Pattern Effectiveness
export const MOCK_TRAP_PATTERN_EFFECTIVENESS: TrapPatternEffectivenessResponse = {
  patterns: [
    { pattern_used: "MISDIRECTION_INJECTION", times_deployed: 48, bait_taken_count: 33, bait_taken_rate: 0.6875 },
    { pattern_used: "NEGATIVE_SEMANTICS_TRAP", times_deployed: 36, bait_taken_count: 29, bait_taken_rate: 0.8056 },
    { pattern_used: "ROLE_PLAY_ANCHORING", times_deployed: 22, bait_taken_count: 9, bait_taken_rate: 0.4091 },
    { pattern_used: "TOKEN_NOISE_INSERTION", times_deployed: 19, bait_taken_count: 6, bait_taken_rate: 0.3158 },
    { pattern_used: "TEMPORAL_CONFUSION", times_deployed: 14, bait_taken_count: 3, bait_taken_rate: 0.2143 },
  ],
};

// Integrity Summary
export const MOCK_INTEGRITY_SUMMARY: IntegritySummaryResponse = {
  pct_responses_elevated_paste_reliance: 0.18,
  pct_assessments_with_elevated_review: 0.24,
  avg_focus_loss_count: 1.7,
  total_responses_analyzed: 312,
};