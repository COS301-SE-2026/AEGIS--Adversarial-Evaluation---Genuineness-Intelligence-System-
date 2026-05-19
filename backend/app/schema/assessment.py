from typing import List, Optional
from pydantic import BaseModel, Field

from .question import QuestionResponse


class AssessmentResponse(BaseModel):
    assessment_id: int = Field(
        ...,
        description="Unique ID for the assessment",
    )
    title: str = Field(..., description="Assessment title")
    description: Optional[str] = Field(
        None, description="Optional longer description",
    )
    duration_mins: int = Field(
        ...,
        description="Duration of the assessment in minutes",
    )
    questions: List[QuestionResponse] = Field(
        ..., description="List of questions included in the assessment",
    )

    class Config:
        orm_mode = True
