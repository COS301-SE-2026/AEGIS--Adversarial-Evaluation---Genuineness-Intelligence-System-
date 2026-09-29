from typing import Optional

from pydantic import BaseModel, Field


class TrapEffectivenessItem(BaseModel):
    trap_id: int = Field(..., description="Adversarial strategy ID")
    trap_name: str = Field(
        ..., description="Name of the adversarial strategy"
    )
    generated_question_count: int = Field(
        ...,
        description="Adversarial questions generated under this strategy",
    )
    completed_attempt_count: int = Field(
        ...,
        description=(
            "Completed candidate attempts that answered a question "
            "generated under this strategy"
        ),
    )
    elevated_review_count: int = Field(
        ...,
        description=(
            "Completed attempts whose per-question score exceeded the "
            "elevated-review threshold"
        ),
    )
    review_signal_rate: Optional[float] = Field(
        None,
        description=(
            "elevated_review_count / completed_attempt_count * 100, "
            "null when there are no completed attempts"
        ),
    )
    evidence_status: str = Field(
        ..., description="NO_DATA, INSUFFICIENT_DATA, or SUFFICIENT_DATA"
    )


class TrapEffectivenessResponse(BaseModel):
    items: list[TrapEffectivenessItem] = Field(
        ..., description="Per-strategy trap effectiveness results"
    )
