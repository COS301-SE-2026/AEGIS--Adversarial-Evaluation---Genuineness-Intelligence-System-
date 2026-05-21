from typing import List, Optional
from pydantic import BaseModel, Field


class QuestionResponse(BaseModel):
    question_bank_id: int = Field(
        ...,
        description=(
            "ID of the source question in the question bank"
        ),
    )
    title: str = Field(
        ..., description="Short title of the question",
    )
    content: str = Field(
        ..., description="Full content/body of the question",
    )
    type: str = Field(
        ..., description="Question type, e.g. 'mcq', 'text', 'coding'",
    )
    maximum_score: int = Field(
        ..., description="Maximum achievable score for this question",
    )
    tags: Optional[List[str]] = Field(
        default_factory=list,
        description="Optional list of tags/categories",
    )

    class Config:
        orm_mode = True
