from typing import Any, List, Optional
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
    maximum_score: float = Field(
        ..., description="Maximum achievable score for this question",
    )
    tags: Optional[List[str]] = Field(
        default_factory=list,
        description="Optional list of tags/categories",
    )
    category_id: int = Field(
        ..., description="Category associated with the question",
    )
    difficulty: str = Field(
        ..., description="Difficulty level for the question",
    )


class QuestionCreation(BaseModel):
    title: str = Field(..., min_length=1, description="Question title")
    content: str = Field(..., min_length=1, description="Question body")
    type: str = Field(
        ..., description="Allowed: MULTIPLE_CHOICE, TEXT, CODING"
    )
    maximum_score: float = Field(..., ge=0, description="Max score")
    correct_answer: Optional[Any] = Field(
        None, description="Expected answer"
    )
    question_metadata: Optional[dict] = Field(
        None, description="Metadata for UI or grading"
    )
    tags: Optional[List[str]] = Field(default_factory=list)
    category_id: int = Field(1, ge=1)
    difficulty: str = Field("Easy")


class QuestionUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1)
    content: Optional[str] = Field(None, min_length=1)
    type: Optional[str] = Field(
        None, description="Allowed: MULTIPLE_CHOICE, TEXT, CODING"
    )
    maximum_score: Optional[float] = Field(None, ge=0)
    correct_answer: Optional[Any] = None
    question_metadata: Optional[dict] = None
    tags: Optional[List[str]] = None
    category_id: Optional[int] = Field(None, ge=1)
    difficulty: Optional[str] = None

    class Config:
        from_attributes = True
