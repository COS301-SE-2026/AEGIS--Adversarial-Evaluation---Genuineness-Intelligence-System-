from pydantic import BaseModel
from enum import Enum


class AIUsageLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"


class TopPerformer(BaseModel):
    candidate_name: str
    score_percent: float


class AIUsageRate(BaseModel):
    level: AIUsageLevel
    percent: float


class AverageScore(BaseModel):
    assessment_name: str
    average_score: float


class DashboardSummaryResponse(BaseModel):
    top_performers: list[TopPerformer]
    total_assessments: int
    ai_usage_rate: AIUsageRate

class DashboardGraphResponse(BaseModel):
    bars: list[AverageScore]