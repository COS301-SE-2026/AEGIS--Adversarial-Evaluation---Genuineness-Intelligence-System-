export interface CandidateMetrics {
    candidate_response_id?: number;
    unique_keys_count?: number;
    chars_alnum?: number;
    chars_special?: number;
    copy_char_count: number

    active_time_ms: number;
    backspace_count: number;
    copy_event_count: number;
    paste_event_count: number;
    paste_char_count: number;
    focus_loss_count: number;
    focus_loss_time_ms: number;
}

export interface CandidateAssessmentMetrics {
    behavioral_summary: string | null;
    metrics: CandidateMetrics[];
}

export type RadarAxisName =
  | "paste_ratio"
  | "backspace_rate"
  | "typing_speed"
  | "focus_loss_rate";

export interface RadarAxis {
  axis: RadarAxisName;
  candidate_value: number;
  cohort_avg_value: number;
}

export interface MetricsRadarResponse {
  axes: RadarAxis[];
  cohort_sample_size: number;
  insufficient_cohort_data: boolean;
}

export type ReviewBand = "low" | "medium" | "high";

export interface ReviewPriorityResponse {
  score: number;
  band: ReviewBand;
  contributing_factors: string[];
}


"======Review Priority======="

export type QuestionType = "CODING" | "MULTIPLE_CHOICE" | "FILL_IN_THE_BLANK";
export type CorrectnessStatus = "CORRECT" | "PARTIAL" | "INCORRECT" | null;

export type Answer = {
    candidate_answer: string;
    score: number;
    is_correct: CorrectnessStatus;
}

export type QuestionAnalytics = {
    question_order: number;
    assessment_q_id: number;
    question_bank_id: number;
    title: string;
    content: string;
    type: QuestionType;
    maximum_score: number;
    answered: boolean;
    answer: Answer | null;
    metrics: CandidateMetrics | null;
    review_score: number| null;
    review_band: ReviewBand | null;
    contributing_factors: string[];
    options?: string[]
    correct_answer?: string | null;
}

export type QuestionAnalyticsResponse = {
  candidate_assessment_id: number;
  questions: QuestionAnalytics[];
}

export type ReviewBandMeta = {
  label: string;
  color: string;
}

export const REVIEW_BAND_META: Record<ReviewBand, ReviewBandMeta> ={
  low: {label: "Low", color: "var(--color-status-success)"},
  medium: {label: "Medium", color: "var(--color-status-warning)"},
  high: {label: "High", color: "var(--color-system-red)"},
}

export function clampScore(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(100, Math.max(0,value));
}

export function formatMs(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minute = Math.floor(seconds / 60);
  const second = seconds % 60;
  return `${minute}m ${second}s`;
}

export function calculatePastePercentage(metrics: CandidateMetrics | null):  number {
  if (!metrics) return 0;
  const totalChars = metrics.paste_char_count + metrics.copy_char_count;
  if (totalChars === 0 || totalChars === null) return 0;
  return Math.round((metrics.paste_char_count / totalChars) * 100);
}