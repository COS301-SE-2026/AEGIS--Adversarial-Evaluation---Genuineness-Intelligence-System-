from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.question_bank import QuestionBank, QuestionType
from app.models.question_category import QuestionCategory
from app.schema.question import QuestionCreation


def convert_question_type(raw_type: str) -> QuestionType:
    normalized = (raw_type or "").strip().upper()
    for enum_value in QuestionType:
        if normalized in {enum_value.name, enum_value.value}:
            return enum_value
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="Invalid question type. Use MULTIPLE_CHOICE, CODING or TEXT.",
    )


def create_source_question(
    db: Session,
    payload: QuestionCreation,
) -> QuestionBank:
    category = (
        db.query(QuestionCategory)
        .filter(QuestionCategory.category_id == payload.category_id)
        .first()
    )
    if category is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question category not found",
        )
    question = QuestionBank(
        title=payload.title.strip(),
        content=payload.content.strip(),
        type=convert_question_type(payload.type),
        question_metadata=payload.question_metadata,
        maximum_score=payload.maximum_score,
        correct_answer=payload.correct_answer,
        tags=payload.tags or [],
        category_id=payload.category_id,
        difficulty=payload.difficulty,
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question
