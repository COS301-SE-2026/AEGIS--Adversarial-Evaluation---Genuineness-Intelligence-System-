from sqlalchemy import Column, Integer, Text, Boolean, TIMESTAMP, func, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base


class CodingTestCase(Base):
    __tablename__ = "coding_test_cases"

    test_case_id = Column(Integer, primary_key=True, autoincrement=True)
    question_id = Column(Integer, ForeignKey("question_bank.question_bank_id"), nullable=False)
    input_data = Column(Text, nullable=False, default="")
    expected_output = Column(Text, nullable=False, default="")
    is_hidden = Column(Boolean, nullable=False, default=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)

    question = relationship("QuestionBank", back_populates="coding_test_cases")