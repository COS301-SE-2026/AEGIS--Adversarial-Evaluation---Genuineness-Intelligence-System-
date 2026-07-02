from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field

from .question import QuestionResponse


class AssessmentCreate(BaseModel):
    title: str = Field(
        ..., min_length=1, description="Assessment title",
    )
    description: Optional[str] = Field(
        None, description="Optional description",
    )
    duration_mins: int = Field(
        ..., gt=0, description="Duration in minutes",
    )


class AssessmentCreatedResponse(BaseModel):
    assessment_id: int
    title: str
    description: Optional[str] = None
    duration_mins: int
    creator_id: int
    status: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class AssessmentQuestionCreate(BaseModel):
    adv_question_id: int = Field(
        ..., description="ID of the adversarial question to add",
    )
    display_order: Optional[int] = Field(
        None, description="Display order of the question",
    )
    marks: Optional[float] = Field(
        None, description="Marks override for this question",
    )


class AssessmentQuestionCreatedResponse(BaseModel):
    assessment_q_id: int
    assessments_id: int
    adv_question_id: int
    display_order: Optional[int] = None
    marks: Optional[float] = None

    class Config:
        from_attributes = True


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
