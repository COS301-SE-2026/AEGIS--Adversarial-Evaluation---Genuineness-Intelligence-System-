import enum
from sqlalchemy import (
    Column, Integer, String, Enum, Float, ForeignKey, TIMESTAMP, func
)
from sqlalchemy.orm import relationship
from app.models.base import Base


class SessionStatus(enum.Enum):
    STARTED = "STARTED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    EXPIRED = "EXPIRED"


class CandidateAssessment(Base):
    __tablename__ = "candidate_assessments"

    id = Column(Integer, primary_key=True)
    status = Column(Enum(SessionStatus), nullable=False)
    access_token = Column(String, unique=True, nullable=False)
    candidate_score = Column(Float, nullable=True)
    total_score = Column(Float, nullable=False)
    start_time = Column(TIMESTAMP, nullable=True)
    end_time = Column(TIMESTAMP, nullable=True)
    candidate_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    assessment_id = Column(Integer, ForeignKey(
        "assessments.id"), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(),
                        onupdate=func.now(), nullable=False)

    candidate = relationship("User", back_populates="sessions")
    assessment = relationship("Assessment", back_populates="sessions")
    responses = relationship("CandidateResponse", back_populates="session")
