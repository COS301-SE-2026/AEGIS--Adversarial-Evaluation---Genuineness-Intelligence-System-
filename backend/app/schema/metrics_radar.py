from typing import Literal
from pydantic import BaseModel, Field


class RadarAxis(BaseModel):
    axis: Literal[
        "paste_ratio",
        "backspace_rate",
        "typing_speed",
        "focus_loss_rate",
    ]
    candidate_value: float = Field(..., ge=0.0, le=1.0)
    cohort_avg_value: float = Field(..., ge=0.0, le=1.0)


class MetricsRadarResponse(BaseModel):
    axes: list[RadarAxis]
    cohort_sample_size: int
    insufficient_cohort_data: bool