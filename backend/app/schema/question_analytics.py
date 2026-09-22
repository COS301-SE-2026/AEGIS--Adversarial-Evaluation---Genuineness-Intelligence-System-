from typing import List, Literal, Optional
from pydantic import BaseModel, Field

# all the metrics are specific to the question
class QuestionAnalyticsMetrics(BaseModel):
    active_time_ms: int = Field(
        ..., description="Time actively spent, in ms",
    )
    backspace_count: int = Field(
        ..., description="Backspace presses recorded",
    )
    copy_event_count: int = Field(
        ..., description="Copy events recorded",
    )
    copy_char_count: int = Field(
        ..., description="Characters copied",
    )
    paste_event_count: int = Field(
        ..., description="Paste events recorded",
    )
    paste_char_count: int = Field(
        ..., description="Characters pasted",
    )
    focus_loss_count: int = Field(
        ..., description="Focus-loss events recorded",
    )
    focus_loss_time_ms: int = Field(
        ..., description="Time spent unfocused while on this question, in ms",
    )


class QuestionAnalyticsAnswer(BaseModel):
    candidate_answer: Optional[str] = Field(
        None, description="The candidate's submitted answer",
    )
    score: Optional[float] = Field(
        None, description="Score awarded for this response",
    )
    is_correct: Optional[str] = Field(
        None,
        description="Correctness verdict (CORRECT/PARTIAL/INCORRECT)",
    )


class QuestionAnalyticsItem(BaseModel):
    question_order: int = Field(
        ..., description="1-based position of this question in the assessment",
    )
    assessment_q_id: int = Field(
        ..., description="ID of the assessment_questions row",
    )
    question_bank_id: int = Field(
        ..., description="ID of the source question in the question bank",
    )
    title: str = Field(..., description="Short title of the question")
    content: str = Field(
        ...,
        description=(
            "Question content shown to the candidate: the adversarial "
            "variant if one exists, otherwise the source question content"
        ),
    )
    type: str = Field(
        ..., description="Question type, e.g. MULTIPLE_CHOICE, CODING",
    )
    maximum_score: float = Field(
        ..., description="Maximum achievable score",
    )
    answered: bool = Field(
        ..., description="Whether the candidate submitted a response",
    )
    answer: Optional[QuestionAnalyticsAnswer] = Field(
        None, description="The candidate's response, null if unanswered",
    )
    metrics: Optional[QuestionAnalyticsMetrics] = Field(
        None,
        description=(
            "Aggregated behavioural metrics, null if no "
            "telemetry was recorded"
        ),
    )
    review_score: Optional[float] = Field(
        None,
        description="Review priority score for question, null if unanswered",
    )
    review_band: Optional[Literal["low", "medium", "high"]] = Field(
        None, description="Review-priority band",
    )
    contributing_factors: List[str] = Field(
        default_factory=list,
        description="Human-readable factors that contributed to the score",
    )


class QuestionAnalyticsResponse(BaseModel):
    candidate_assessment_id: int = Field(
        ..., description="ID of the candidate assessment session",
    )
    questions: List[QuestionAnalyticsItem] = Field(
        ..., description="Every assessment question, in assessment order",
    )
