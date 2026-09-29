from typing import Optional

from pydantic import BaseModel, Field


class TrapRecommendationItem(BaseModel):
    trap_id: int = Field(..., description="Adversarial strategy ID")
    recommendation_available: bool = Field(
        ...,
        description=(
            "True only for the single top-recommended strategy"
        ),
    )
    recommendation: Optional[str] = Field(
        None, description="Human-readable recommendation text",
    )
    evidence_status: str = Field(
        ..., description="NO_DATA, INSUFFICIENT_DATA, or SUFFICIENT_DATA"
    )
    reason: Optional[str] = Field(
        None,
        description="Why this strategy was, or was not, recommended",
    )


class TrapRecommendationResponse(BaseModel):
    items: list[TrapRecommendationItem] = Field(
        ..., description="Per-strategy trap recommendation results",
    )
