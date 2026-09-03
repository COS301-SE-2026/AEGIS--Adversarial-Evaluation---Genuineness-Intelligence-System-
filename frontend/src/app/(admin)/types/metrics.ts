export interface CandidateMetrics {
    candidate_response_id: number;
    active_time_ms: number;
    unique_keys_count: number;
    chars_alnum: number;
    chars_special: number;
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