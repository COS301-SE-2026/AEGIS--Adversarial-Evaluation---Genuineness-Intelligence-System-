from datetime import datetime
from enum import Enum
from pydantic import BaseModel, Field
from app.models.assessment_question import RecommendationStatus


class EvidenceStatus(str, Enum):
    NOT_AVAILABLE = "not_available"
    AVAILABLE = "available"
    INSUFFICIENT_DATA = "insufficient_data"
    FAILED = "failed"


class WeightDecision(str, Enum):
    ACCEPT = "accept"
    MODIFY = "modify"
    REJECT = "reject"


class PreAssessmentIntegrityWeightInput(BaseModel):
    adv_question_id: int
    recruiter_weight: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
    )


class PreAssessmentIntegrityWeightRequest(BaseModel):
    questions: list[PreAssessmentIntegrityWeightInput] = Field(
        ...,
        min_length=1,
    )


class PreAssessmentIntegrityWeightRecommendation(BaseModel):
    adv_question_id: int
    recruiter_weight: float | None = None
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
    recommendation_id: str
    recommendations: list[
        PreAssessmentIntegrityWeightRecommendation
    ]


class PreAssessmentWeightDecision(BaseModel):
    adv_question_id: int
    decision: WeightDecision
    approved_weight: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
    )


class PreAssessmentWeightDecisionsRequest(BaseModel):
    recommendation_id: str
    decisions: list[PreAssessmentWeightDecision] = Field(
        ...,
        min_length=1,
    )


class ApprovedPreAssessmentWeight(BaseModel):
    adv_question_id: int
    approved_weight: float | None = Field(
        default=None,
        ge=0.0,
        le=1.0,
    )
    decision: WeightDecision


class PreAssessmentWeightDecisionsResponse(BaseModel):
    recommendation_id: str
    approved_weights: list[ApprovedPreAssessmentWeight]
    total_approved_weight: float
    ready_for_assessment_creation: bool
