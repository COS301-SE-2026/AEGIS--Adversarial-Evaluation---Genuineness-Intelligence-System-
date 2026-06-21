from sqlalchemy import (Column, Integer, String, Text, Float, TIMESTAMP,
                        func, ForeignKey)
from sqlalchemy.orm import relationship
from app.models.base import Base


class AIAnalysis(Base):
    __tablename__ = "ai_analysis"

    analysis_id = Column(Integer, primary_key=True, autoincrement=True)
    response_id = Column(Integer,
                         ForeignKey("candidate_responses.response_id"),
                         nullable=False)
    model_name = Column(String, nullable=False)
    reference_answer = Column(Text, nullable=False)
    similarity_score = Column(Float, nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)

    response = relationship("CandidateResponse")
