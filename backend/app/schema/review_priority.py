from typing import Literal, Optional
from pydantic import BaseModel


class NotableQuestion(BaseModel):
    question_order: int
    score: float
    top_factor: Optional[str]


class ReviewPriorityResponse(BaseModel):
    score: int
    band: Literal["low", "medium", "high"]
    contributing_factors: list[str]
    notable_question: Optional[NotableQuestion] = None
