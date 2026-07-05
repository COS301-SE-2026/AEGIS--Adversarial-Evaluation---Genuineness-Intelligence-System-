from sqlalchemy import Column, Integer, Text, DateTime, func
from sqlalchemy.orm import relationship
from app.models.base import Base

class AdversarialStrategy(Base):
    __tablename__ = "adversarial_strategies"
    strategy_id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(Text, nullable=False, unique=True)
    description = Column(Text, nullable=False)
    created_at = Column(DateTime, server_default=func.now(), nullable=False)
    adversarial_questions = relationship(
        "AdversarialQuestion",
        back_populates="strategy",
    )