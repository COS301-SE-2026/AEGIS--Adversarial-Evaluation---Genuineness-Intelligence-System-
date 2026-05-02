import enum
from sqlalchemy import Column, Integer, String, Enum, Float, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.models.base import Base


class CorrectnessStatus(enum.Enum):
    CORRECT = "CORRECT"
    PARTIAL = "PARTIAL"
    INCORRECT = "INCORRECT"


class CandidateResponse(Base):
    __tablename__ = "candidate_responses"

    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("candidate_sessions.id"), nullable=False)
    assessment_question_id = Column(Integer, ForeignKey("questions.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    raw_submission = Column(String, nullable=True)
    score = Column(Float, nullable=True)
    is_correct = Column(Enum(CorrectnessStatus), nullable=False)

    session = relationship("CandidateSession", back_populates="responses")
    question = relationship("Question")