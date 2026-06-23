import enum
from sqlalchemy import (
    Column, Integer, String, Enum, TIMESTAMP, Float, JSON, ARRAY,
    func, ForeignKey
)
from sqlalchemy.orm import relationship
from app.models.base import Base
from sqlalchemy.dialects.postgresql import ARRAY


class QuestionType(enum.Enum):
    MULTIPLE_CHOICE = "MULTIPLE_CHOICE"
    TEXT = "TEXT"
    CODING = "CODING"


class QuestionBank(Base):
    __tablename__ = "question_bank"

    question_bank_id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    type = Column(Enum(QuestionType), nullable=False)
    question_metadata = Column(JSON, nullable=True)
    maximum_score = Column(Float, nullable=False)
    correct_answer = Column(JSON, nullable=True)
    tags = Column(ARRAY(String), nullable=True)
    category_id = Column(
        Integer,
        ForeignKey("question_categories.category_id"),
        nullable=False, default=1)
    difficulty = Column(String, nullable=False, default="Easy")
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(),
                        onupdate=func.now(), nullable=False)

    category = relationship("QuestionCategory")
    adversarial_questions = relationship("AdversarialQuestion",
                                         back_populates="source_question")
    coding_test_cases = relationship("CodingTestCase",
                                     back_populates="question")
