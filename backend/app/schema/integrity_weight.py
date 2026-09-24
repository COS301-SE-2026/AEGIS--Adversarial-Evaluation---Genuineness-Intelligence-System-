from datetime import datetime
from enum import Enum
from pydantic import BaseModel, ConfigDict, Field
from app.models.assessment_question import RecommendationStatus


class EvidenceStatus(str, Enum):
    NOT_AVAILABLE = "not_available"
    AVAILABLE = "available"
    INSUFFICIENT_DATA = "insufficient_data"
    FAILED = "failed"


class PreAssessmentIntegrityWeightRequest(BaseModel):
    adv_question_ids: list[int] = Field(..., min_length=1)


class PreAssessmentIntegrityWeightRecommendation(BaseModel):
    adv_question_id: int
    ai_suggested_weight: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
    )
    recommendation_status: RecommendationStatus
    ai_recommendation: str | None = None
    ai_generated_at: datetime | None = None
    evidence_status: EvidenceStatus
    historical_sample_size: int = Field(ge=0)
    failure_details: str | None = None


class PreAssessmentIntegrityWeightResponse(BaseModel):
    recommendations: list[PreAssessmentIntegrityWeightRecommendation]