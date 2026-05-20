from typing import Optional

from pydantic import BaseModel, Field


class ResponseCreate(BaseModel):
    assessment_question_id: int = Field(
        ..., description=(
            "ID of the assessment question being answered"
        ),
    )
    candidate_answer: str = Field(
        ..., description="Candidate's answer/content",
    )


class ResponseUpdate(BaseModel):
    candidate_answer: str = Field(
        ..., description="Updated answer content for the question",
    )

    class Config:
        orm_mode = True


class CandidateResponseResponse(BaseModel):
    response_id: int
    candidate_assessment_id: int
    assessment_question_id: int
    candidate_answer: Optional[str] = None
    score: Optional[float] = None
    is_correct: Optional[str] = None

    class Config:
        orm_mode = True
