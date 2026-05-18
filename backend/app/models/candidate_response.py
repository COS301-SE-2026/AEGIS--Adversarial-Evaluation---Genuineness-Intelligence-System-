import enum
from sqlalchemy import Column, Integer, String, Enum, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base


class CorrectnessStatus(enum.Enum):
    CORRECT = "CORRECT"
    PARTIAL = "PARTIAL"
    INCORRECT = "INCORRECT"


class CandidateResponse(Base):
    __tablename__ = "candidate_responses"

    response_id = Column(Integer, primary_key=True, autoincrement=True)
    candidate_assessment_id = Column(
        Integer, ForeignKey("candidate_assessments.candidate_assess_id"), nullable=False)
    assessment_question_id = Column(
        Integer, ForeignKey("assessment_questions.assessment_q_id"), nullable=False)
    candidate_answer = Column(String, nullable=True)
    score = Column(Float, nullable=True)
    is_correct = Column(Enum(CorrectnessStatus), nullable=True)

    candidate_assessment = relationship(
        "CandidateAssessment", back_populates="responses")
    assessment_question = relationship(
    "AssessmentQuestion", back_populates="responses"
)
