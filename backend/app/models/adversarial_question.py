from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, func, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base

class AdversarialQuestion(Base):
    __tablename__ = "adversarial_questions"
    adv_question_id = Column(Integer, primary_key=True, autoincrement=True)
    source_question_id = Column(Integer, ForeignKey("question_bank.question_bank_id"), nullable=False)
    content = Column(Text, nullable=False, default="")
    strategy_used = Column(Text, nullable=False)
    llm = Column(String, nullable=True)
    generated_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)

    source_question = relationship("QuestionBank", back_populates="adversarial_questions")