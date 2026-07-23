from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from typing import Optional
from app.models.question_bank import QuestionBank, QuestionType
from app.models.question_category import QuestionCategory
from app.schema.question import QuestionCreation, QuestionUpdate


def convert_question_type(raw_type: str) -> QuestionType:
    normalized = (raw_type or "").strip().upper()
    if normalized in {"TEXT", "FILL_IN_THE_BLANK"}:
        return QuestionType.FILL_IN_THE_BLANK
    if normalized in {"MCQ", "MULTIPLE_CHOICE"}:
        return QuestionType.MULTIPLE_CHOICE
    for enum_value in QuestionType:
        if normalized in {enum_value.name, enum_value.value}:
            return enum_value
    raise HTTPException(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        detail=(
            "Invalid question type. Use MULTIPLE_CHOICE, "
            "FILL_IN_THE_BLANK or CODING."
        ),
    )


def _normalize_mcq_payload(
    metadata: dict | None,
    correct_answer: object,
) -> tuple[dict[str, str], dict[str, str]]:
    if not isinstance(metadata, dict):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="MCQ questions require question_metadata.options.",
        )

    raw_options = metadata.get("options")
    if not isinstance(raw_options, dict):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="MCQ questions require question_metadata.options",
        )

    expected_labels = ["A", "B", "C", "D"]
    if set(raw_options.keys()) != set(expected_labels):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="MCQ must contain four options labeled A,B,C,and D.",
        )

    normalized_options: dict[str, str] = {}
    for label in expected_labels:
        option_value = raw_options.get(label)
        if not isinstance(option_value, str) or not option_value.strip():
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail=f"MCQ option {label} must be a non-empty string.",
            )
        normalized_options[label] = option_value.strip()

    if not isinstance(correct_answer, dict):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="MCQ questions require correct_answer.answer.",
        )

    answer_key = correct_answer.get("answer")
    if not isinstance(answer_key, str):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="MCQ correct_answer.answer must be a string.",
        )

    normalized_answer = answer_key.strip().upper()
    if normalized_answer not in normalized_options:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="MCQ correct_answer.answer must match one of A,B,C,or D.",
        )

    return normalized_options, {"answer": normalized_answer}


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

    question_type = convert_question_type(payload.type)
    question_metadata = payload.question_metadata
    correct_answer = payload.correct_answer

    if question_type == QuestionType.MULTIPLE_CHOICE:
        normalized_options, normalized_answer = _normalize_mcq_payload(
            payload.question_metadata,
            payload.correct_answer,
        )
        question_metadata = {"options": normalized_options}
        correct_answer = normalized_answer

    question = QuestionBank(
        title=payload.title.strip(),
        content=payload.content.strip(),
        type=question_type,
        question_metadata=question_metadata,
        maximum_score=payload.maximum_score,
        correct_answer=correct_answer,
        tags=payload.tags or [],
        category_id=payload.category_id,
        difficulty=payload.difficulty,
    )
    db.add(question)
    db.commit()
    db.refresh(question)
    return question


def get_all_questions(db: Session) -> list[QuestionBank]:
    return (
        db.query(QuestionBank)
        .order_by(QuestionBank.question_bank_id.desc())
        .all()
    )


def get_filtered_questions(
    db: Session,
    tags: Optional[list[str]] = None,
    difficulty: Optional[str] = None,
    category_id: Optional[int] = None,
) -> list[QuestionBank]:
    query = db.query(QuestionBank)
    if tags:
        # overlap ensures any matching tag is returned
        query = query.filter(QuestionBank.tags.overlap(tags))

    if difficulty:
        query = query.filter(QuestionBank.difficulty == difficulty)

    if category_id is not None:
        query = query.filter(QuestionBank.category_id == category_id)

    return query.order_by(QuestionBank.question_bank_id.desc()).all()


def update_question(
    db: Session,
    question_bank_id: int,
    payload: QuestionUpdate,
) -> QuestionBank:
    question = (
        db.query(QuestionBank)
        .filter(QuestionBank.question_bank_id == question_bank_id)
        .first()
    )

    if question is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found",
        )

    question_type = question.type

    # Validate the given category id.
    if payload.category_id is not None:
        category = (
            db.query(QuestionCategory)
            .filter(QuestionCategory.category_id == payload.category_id)
            .first()
        )
        if category is None:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Question category not valid/found",
            )
        question.category_id = payload.category_id

    if payload.title is not None:
        question.title = payload.title.strip()

    if payload.content is not None:
        question.content = payload.content.strip()

    if payload.type is not None:
        # Ensure valid question type.
        question_type = convert_question_type(payload.type)
        question.type = question_type

    if question_type == QuestionType.MULTIPLE_CHOICE:
        if (
            payload.question_metadata is not None
            or payload.correct_answer is not None
        ):
            normalized_options, normalized_answer = _normalize_mcq_payload(
                payload.question_metadata,
                payload.correct_answer,
            )
            question.question_metadata = {"options": normalized_options}
            question.correct_answer = normalized_answer

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
