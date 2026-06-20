from sqlalchemy import (Column, Integer, String, TIMESTAMP, func)
from app.models.base import Base

class QuestionCategory(Base):
    __tablename__ = "question_categories",

    category_id = Column(Integer, primary_key=True, autoincrement=True)
    category_name = Column(String, nullable=False, default="Uncategorised")
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)