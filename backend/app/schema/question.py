from typing import Any, List, Optional
from pydantic import BaseModel, Field
from datetime import datetime


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

class QuestionCreation(BaseModel):
    title: str = Field(..., min_length=1, description="Question title")
    content: str = Field(..., min_length=1, description="Question body")
    type: str = Field(..., description="Allowed: MULTIPLE_CHOICE, TEXT,CODING")
    maximum_score: float = Field(..., ge=0, description="Max score")
    correct_answer: Optional[Any] = Field(None, description="Expected answer")
    question_metadata: Optional[dict] = Field(None, description="Metadata for UI or grading")
    tags: Optional[List[str]] = Field(default_factory=list)
    category_id: int = Field(1, ge=1)
    difficulty: str = Field("Easy")

    class Config:
        orm_mode = True
