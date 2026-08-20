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