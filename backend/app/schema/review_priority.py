from typing import Literal
from pydantic import BaseModel


class ReviewPriorityResponse(BaseModel):
    score: int
    band: Literal["low", "medium", "high"]
    contributing_factors: list[str]
