from sqlalchemy import Column, Integer, Text
from sqlalchemy.orm import relationship
from app.models.base import Base


class AdversarialStrategy(Base):
    __tablename__ = "adversarial_strategies"
    strategy_id = Column(Integer, primary_key=True, autoincrement=True)
    strategy_name = Column(Text, nullable=False, unique=True)
    description = Column(Text, nullable=True)
    trap_mechanism_summary = Column(Text, nullable=True)
    adversarial_questions = relationship(
        "AdversarialQuestion",
        back_populates="strategy",
    )
