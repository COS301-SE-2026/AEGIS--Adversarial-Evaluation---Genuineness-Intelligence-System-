import enum
from sqlalchemy import Column, Integer, String, Enum, TIMESTAMP, Float, JSON, ARRAY, func
from app.models.base import Base


class QuestionType(enum.Enum):
    MULTIPLE_CHOICE = "MULTIPLE_CHOICE"
    TEXT = "TEXT"


class Question(Base):
    __tablename__ = "questions"

    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    content = Column(String, nullable=False)
    type = Column(Enum(QuestionType), nullable=False)
    metadata = Column(JSON, nullable=True)
    maximum_score = Column(Float, nullable=False)
    correct_answer = Column(JSON, nullable=True)
    tags = Column(ARRAY(String), nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)