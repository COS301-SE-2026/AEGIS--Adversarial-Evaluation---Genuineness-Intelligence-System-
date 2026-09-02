from pydantic import BaseModel
from enum import Enum
from typing import Literal


class AIUsageLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class CandidateResultStatus(str, Enum):
    PASS = "PASS"
    FAIL = "FAIL"


class TopPerformer(BaseModel):
    candidate_name: str
    score_percent: float


class AIUsageRate(BaseModel):
    level: AIUsageLevel
    percent: float


class AverageScore(BaseModel):
    assessment_name: str
    average_score: float


class TableItem(BaseModel):
    assessment_id: int
    name: str
    average_score_percent: float
    top_candidate_name: str


class FilterableTableItem(BaseModel):
    candidate_assess_id: int
    candidate_id: int
    candidate_name: str
    total_score_percent: float
    status: CandidateResultStatus
    ai_rating_percent: float


class DashboardSummaryResponse(BaseModel):
    top_performers: list[TopPerformer]
    total_assessments: int
    ai_usage_rate: AIUsageRate


class DashboardGraphResponse(BaseModel):
    bars: list[AverageScore]


class DashboardTableResponse(BaseModel):
    items: list[TableItem]
    page: int
    page_size: int


class AssessmentDetailCardResponse(BaseModel):
    assessment_id: int
    assessment_name: str
    top_performers: list[TopPerformer]
    average_total_percent: float
    average_completion_time: float
    ai_usage: AIUsageRate


class AssessmentDetailTableResponse(BaseModel):
    items: list[FilterableTableItem]
    page: int
    page_size: int


class QuestionQualityBucket(BaseModel):
    bucket: Literal["needs_revision", "balanced", "too_easy", "thin_sample"]
    count: int
    question_ids: list[int]


class QuestionQualityResponse(BaseModel):
    total_questions_answered: int
    buckets: list[QuestionQualityBucket]
    guidance: list[str]


class ThroughputResponse(BaseModel):
    total_assessments: int
    active_count: int
    completed_count: int
    expired_count: int
    avg_time_to_completion_seconds: float | None
    avg_score: float | None
    completion_rate: float