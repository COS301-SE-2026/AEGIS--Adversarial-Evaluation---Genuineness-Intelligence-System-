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
