from typing import List, Optional

from pydantic import BaseModel, Field

from app.schema.question_analytics import QuestionAnalyticsAnswer


class CandidateQuestionResultItem(BaseModel):
    question_order: int = Field(
        ...,
        description="1-based position of this question in the assessment",
    )
    assessment_q_id: int
    question_bank_id: int
    title: str
    content: str
    type: str
    maximum_score: float
    answered: bool
    answer: Optional[QuestionAnalyticsAnswer] = None


class CandidateQuestionResultsResponse(BaseModel):
    candidate_assessment_id: int
    questions: List[CandidateQuestionResultItem]