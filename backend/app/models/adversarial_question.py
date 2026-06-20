from sqlalchemy import Column, Integer, String, Text, TIMESTAMP, func, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base

class AdversarialQuestion(Base):
    __tablename__ = "adversarial_questions"
    adv_question_id = Column(Integer, primary_key=True, autoincrement=True)
    