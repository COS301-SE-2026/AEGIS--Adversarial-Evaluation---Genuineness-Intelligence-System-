from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.question_bank import QuestionBank, QuestionType
from app.models.question_category import QuestionCategory
from app.schema.question import QuestionCreate


def convert_question_type(raw_type: str) -> QuestionType:
    normalized = (raw_type or "").strip().upper()
    for enum_value in QuestionType:
        if normalized in {enum_value.name, enum_value.value}:
            return enum_value
    raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="Invalid question type. Use MULTIPLE_CHOICE, CODING or TEXT.",
    )

