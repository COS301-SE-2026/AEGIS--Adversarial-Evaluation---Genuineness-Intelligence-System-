export interface BehavioralSummary {
    summary: string | null;
    generated_at: string | null; // ISO timestamp
}

export type TimelineEventType = "paste" | "focus_loss" | "typing_burst";

export interface TimelineEvent {
    event_type: TimelineEventType;
    start_offset_ms: number;
    duration_ms: number;
    question_id: number;
    magnitude: number | null;
}

export interface QuestionTimelineSegment {
    question_id: number;
    question_order: number;
    active_time_ms: number;
    events: TimelineEvent[];
}

export interface MetricsTimelineResponse {
    total_active_time_ms: number;
    questions: QuestionTimelineSegment[];
}
