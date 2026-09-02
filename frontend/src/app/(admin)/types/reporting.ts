// Types mirroring the frozen backend contract in the Reporting Feature build
// plan, §2 (Stream 1 — Assessment-Wide Dashboard). Keep these in lockstep
// with backend/app/schema/... once BE-A's routes land — field names here
// are copied verbatim from the frozen Pydantic models.

// ─── 2.1 GET /reporting/question-quality ───────────────────────────────────

export type QuestionQualityBucketKey =
  | "needs_revision"
  | "balanced"
  | "too_easy"
  | "thin_sample";

export interface QuestionQualityBucket {
  bucket: QuestionQualityBucketKey;
  count: number;
  question_ids: number[];
}

export interface QuestionQualityResponse {
  total_questions_answered: number;
  buckets: QuestionQualityBucket[];
  guidance: string[];
}

// ─── 2.2 GET /reporting/performance-breakdown?by=... ───────────────────────

export type BreakdownBy = "category" | "difficulty" | "adversarial";

export interface BreakdownSlice {
  label: string;
  avg_success_rate: number; // 0.0-1.0
  attempt_count: number;
}

export interface PerformanceBreakdownResponse {
  by: BreakdownBy;
  slices: BreakdownSlice[];
}

// ─── 2.3 GET /reporting/throughput ──────────────────────────────────────────

export interface ThroughputResponse {
  total_assessments: number;
  active_count: number;
  completed_count: number;
  expired_count: number;
  avg_time_to_completion_seconds: number | null;
  avg_score: number | null;
  completion_rate: number; // 0.0-1.0
}

// ─── 2.4 GET /reporting/score-trend?granularity=... ────────────────────────

export type ScoreTrendGranularity = "week" | "month";

export interface ScoreTrendPoint {
  period_label: string; // e.g. "2026-W32"
  period_start: string; // ISO date string
  avg_score: number;
  completed_count: number;
}

export interface ScoreTrendResponse {
  granularity: ScoreTrendGranularity;
  points: ScoreTrendPoint[];
}

// ─── 2.5 GET /reporting/trap-pattern-effectiveness ─────────────────────────

export interface PatternEffectiveness {
  pattern_used: string;
  times_deployed: number;
  bait_taken_count: number;
  bait_taken_rate: number; // 0.0-1.0
}

export interface TrapPatternEffectivenessResponse {
  patterns: PatternEffectiveness[];
}

// ─── 2.6 GET /reporting/integrity-summary ──────────────────────────────────

export interface IntegritySummaryResponse {
  pct_responses_elevated_paste_reliance: number; // 0.0-1.0
  pct_assessments_with_elevated_review: number; // 0.0-1.0
  avg_focus_loss_count: number;
  total_responses_analyzed: number;
}