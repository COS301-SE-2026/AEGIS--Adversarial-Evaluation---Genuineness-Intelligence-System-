from pydantic import BaseModel

class CandidateMetricsResponse(BaseModel):
    candidate_response_id: int
    candidate_assessment_id: int
    active_time_ms: int
    unique_keys_count: int
    chars_alnum: int
    chars_special: int
    backspace_count: int
    copy_event_count: int
    paste_event_count: int
    paste_char_count: int
    focus_loss_count: int
    focus_loss_time_ms: int
