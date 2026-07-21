from sqlalchemy import (Column, Integer, String, Text, TIMESTAMP,
                        func, ForeignKey)
from sqlalchemy.orm import relationship
from app.models.base import Base


class AdversarialQuestion(Base):
    __tablename__ = "adversarial_questions"
    adv_question_id = Column(Integer, primary_key=True, autoincrement=True)
    source_question_id = Column(Integer,
                                ForeignKey("question_bank.question_bank_id"),
                                nullable=False)
    content = Column(Text, nullable=False, default="")
    strategy_id = Column(Integer,
                         ForeignKey("adversarial_strategies.strategy_id"),
                         nullable=False)
    llm = Column(String, nullable=True)
    generated_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    correct_answer = Column(Text, nullable=True)
    predicted_wrong_answer = Column(Text, nullable=True)
    trap_mechanism = Column(Text, nullable=True)
    pattern_used = Column(Text, nullable=True)

    source_question = relationship("QuestionBank",
                                   back_populates="adversarial_questions")
    strategy = relationship("AdversarialStrategy",
                            back_populates="adversarial_questions")
    assessment_questions = relationship("AssessmentQuestion",
                                        back_populates="adversarial_question")
