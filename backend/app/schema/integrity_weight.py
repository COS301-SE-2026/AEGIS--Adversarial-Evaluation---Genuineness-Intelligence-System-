from datetime import datetime
from enum import Enum
from pydantic import BaseModel, ConfigDict, Field
from app.models.assessment_question import RecommendationStatus


class EvidenceStatus(str, Enum):
    NOT_AVAILABLE = "not_available"
    AVAILABLE = "available"
    INSUFFICIENT_DATA = "insufficient_data"
    FAILED = "failed"


class IntegrityWeightResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    assessment_q_id: int
    adv_question_id: int
    display_order: int | None = None
    default_weight: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
    )
    recruiter_weight: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
    )
    ai_suggested_weight: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
    )
    approved_weight: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
    )
    effective_weight: float = Field(
        default=1.0,
        ge=0.0,
        le=1.0,
    )
    recommendation_status: RecommendationStatus
    ai_recommendation: str | None = None
    ai_generated_at: datetime | None = None
    evidence_status: EvidenceStatus = EvidenceStatus.NOT_AVAILABLE
    historical_sample_size: int | None = Field(
        default=None,
        ge=0,
    )
