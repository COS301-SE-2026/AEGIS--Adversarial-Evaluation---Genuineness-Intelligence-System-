from datetime import datetime
from typing import Literal, Optional
from pydantic import BaseModel, Field


class BehavioralSummaryResponse(BaseModel):
    summary: Optional[str] = Field(
        None,
        description=(
            "AI-generated behavioral summary for this attempt, or None "
            "if one has not been generated yet"
        ),
    )
    generated_at: Optional[datetime] = Field(
        None,
        description=(
            "When the summary was generated. Always None this cycle — "
            "no column tracks this timestamp"
        ),
    )


EventType = Literal["paste", "focus_loss", "typing_burst"]


class TimelineEvent(BaseModel):
    event_type: EventType
    start_offset_ms: int = Field(
        ...,
        description=(
            "Always 0 this cycle — events are whole-question markers, "
            "not positioned sub-events"
        ),
    )
    duration_ms: int = Field(
        ..., description="Equal to the question's active_time_ms",
    )
    question_id: int = Field(
        ..., description="question_bank_id of the underlying source question",
    )
    magnitude: Optional[int] = Field(
        None,
        description=(
            "paste_char_count for paste events, focus_loss_count for "
            "focus_loss events, None for typing_burst"
        ),
    )


class QuestionTimelineSegment(BaseModel):
    question_id: int
    question_order: int
    active_time_ms: int
    events: list[TimelineEvent]


class MetricsTimelineResponse(BaseModel):
    total_active_time_ms: int
    questions: list[QuestionTimelineSegment]
