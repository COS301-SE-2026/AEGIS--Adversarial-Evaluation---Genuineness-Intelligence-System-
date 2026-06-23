from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from app.models.question_bank import QuestionBank, QuestionType
from app.models.question_category import QuestionCategory
from app.schema.question import QuestionCreation,QuestionUpdate


def convert_question_type(raw_type: str) -> QuestionType:
    normalized = (raw_type or "").strip().upper()
    for enum_value in QuestionType:
        if normalized in {enum_value.name, enum_value.value}:
            return enum_value
    raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail="Invalid question type. Use MULTIPLE_CHOICE, CODING or TEXT.",
    )


def create_source_question(db: Session,payload: QuestionCreation,)-> QuestionBank:
    category = (
        db.query(QuestionCategory).
        filter(QuestionCategory.category_id == payload.category_id)
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
        type= convert_question_type(payload.type),
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


    
def get_all_questions(db: Session) -> list[QuestionBank]:
    return(
        db.query(QuestionBank).order_by(QuestionBank.question_bank_id.desc()).all()
    )

def get_filtered_questions (db: Session,tags: Optional[list[str]] = None, difficulty: Optional[str] = None, category_id: Optional[int] = None) -> list[QuestionBank]:
    query = db.query(QuestionBank)
    if tags:
        query = query.filter(QuestionBank.tags.overlap(tags)) #overlap will ensure that it returns questions that contain any of those tags

    if difficulty:
        query = query.filter(QuestionBank.difficulty == difficulty)

    if category_id is not None:
        query = query.filter(QuestionBank.category_id == category_id)

    return query.order_by(QuestionBank.question_bank_id.desc()).all()

def update_question(db: Session, question_bank_id: int, payload: QuestionUpdate) -> QuestionBank:
    question = (db.query(QuestionBank).filter(QuestionBank.question_bank_id == question_bank_id).first())

    if question is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,detail="Question not found")
    
    #check/validate the given category id.
    if payload.category_id is not None:
        category = (db.query(QuestionCategory).filter(QuestionCategory.category_id == payload.category_id).first())
        if category is None:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND,detail="Question category not valid/found")
        question.category_id = payload.category_id

    if payload.title is not None:
        question.title = payload.title.strip()

    if payload.content is not None:
        question.content = payload.content.strip()

    if payload.type is not None:
        question.type = convert_question_type(payload.type)#calling convert service to ensure valid question type

    if payload.maximum_score is not None:
        question.maximum_score = payload.maximum_score

    if payload.correct_answer is not None:
        question.correct_answer = payload.correct_answer

    if payload.question_metadata is not None:
        question.question_metadata = payload.question_metadata

    if payload.tags is not None:
        question.tags = payload.tags

    if payload.difficulty is not None:
        question.difficulty = payload.difficulty

    db.commit()
    db.refresh(question)
    return question