from datetime import datetime
from pydantic import BaseModel, Field


class MetricsDelta(BaseModel):
    active_time_ms: int = Field(
        ..., ge=0, description="Active time in ms since the last flush",
    )
    chars_alnum: int = Field(
        ..., ge=0,
        description="Alphanumeric characters typed since the last flush",
    )
    chars_special: int = Field(
        ..., ge=0, description="Special characters typed since the last flush",
    )
    backspace_count: int = Field(
        ..., ge=0, description="Backspace presses since the last flush",
    )
    copy_event_count: int = Field(
        ..., ge=0, description="Copy events since the last flush",
    )
    paste_event_count: int = Field(
        ..., ge=0, description="Paste events since the last flush",
    )
    paste_char_count: int = Field(
        ..., ge=0, description="Characters pasted since the last flush",
    )
    focus_loss_count: int = Field(
        ..., ge=0, description="Focus-loss events since the last flush",
    )
    focus_loss_time_ms: int = Field(
        ..., ge=0,
        description="Time spent unfocused in ms since the last flush",
    )


class MetricsCumulative(BaseModel):
    unique_keys_count: int = Field(
        ..., ge=0, description="Running count of distinct keys pressed",
    )


class MetricsFlushRequest(BaseModel):
    candidate_assessment_id: int = Field(
        ..., description="ID of the candidate assessment session",
    )
    delta: MetricsDelta = Field(
        ..., description="Increments to add to the stored metrics",
    )
    cumulative: MetricsCumulative = Field(
        ..., description="Latest values for metrics tracked as running totals",
    )


class MetricsFlushResponse(BaseModel):
    candidate_response_id: int
    updated_at: datetime

    class Config:
        orm_mode = True


class CandidateResponseMetricsResponse(BaseModel):
    candidate_response_id: int
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

    class Config:
        orm_mode = True
