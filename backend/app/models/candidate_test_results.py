from sqlalchemy import Column, Integer, Boolean, TIMESTAMP, func, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base


class CandidateTestResult(Base):
    __tablename__ = "candidate_test_results"
    result_id = Column(Integer, primary_key=True, autoincrement=True)
    response_id = Column(Integer, ForeignKey("candidate_responses.response_id"), nullable=False)
    test_case_id = Column(Integer, ForeignKey("coding_test_cases.test_case_id"), nullable=False)
    passed = Column(Boolean, nullable=False, default=False)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    response = relationship("CandidateResponse")
    test_case = relationship("CodingTestCase")