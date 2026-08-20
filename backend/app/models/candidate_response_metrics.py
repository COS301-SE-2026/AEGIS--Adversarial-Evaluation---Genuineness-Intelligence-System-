from sqlalchemy import (
    Column, Integer, BigInteger, ForeignKey, TIMESTAMP, func
)
from sqlalchemy.orm import relationship
from app.models.base import Base


class CandidateResponseMetrics(Base):
    __tablename__ = "candidate_response_metrics"

    candidate_response_id = Column(
        Integer, ForeignKey("candidate_responses.response_id"),
        primary_key=True)
    candidate_assessment_id = Column(
        Integer, ForeignKey("candidate_assessments.candidate_assess_id"),
        nullable=False, index=True)
    active_time_ms = Column(BigInteger, nullable=False, default=0)
    unique_keys_count = Column(Integer, nullable=False, default=0)
    chars_alnum = Column(Integer, nullable=False, default=0)
    chars_special = Column(Integer, nullable=False, default=0)
    backspace_count = Column(Integer, nullable=False, default=0)
    copy_event_count = Column(Integer, nullable=False, default=0)
    paste_event_count = Column(Integer, nullable=False, default=0)
    paste_char_count = Column(Integer, nullable=False, default=0)
    focus_loss_count = Column(Integer, nullable=False, default=0)
    focus_loss_time_ms = Column(BigInteger, nullable=False, default=0)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(),
                        nullable=False)
    updated_at = Column(TIMESTAMP(timezone=True), server_default=func.now(),
                        onupdate=func.now(), nullable=False)

    candidate_response = relationship("CandidateResponse")
    candidate_assessment = relationship("CandidateAssessment")
