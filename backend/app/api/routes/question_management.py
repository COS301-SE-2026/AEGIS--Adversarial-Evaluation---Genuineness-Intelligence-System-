from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import Optional
from app.core.security import get_current_user
from app.database.database import get_db
from app.schema.question import (
    CodingReferenceExecutionRequest,
    CodingReferenceExecutionResponse,
    QuestionCreation,
    QuestionResponse,
    QuestionUpdate
)
from app.services.question_management import (
    create_source_question,
    get_all_questions,
    get_filtered_questions,
    update_question
)
from app.services.assessment import execute_reference_implementation

router = APIRouter(prefix="/questions", tags=["questions"])


def build_question_response(question):
    question_type = getattr(question, "type", None)
    question_type_value = getattr(question_type, "value", question_type)
    if not isinstance(question_type_value, str):
        question_type_value = "TEXT"
    category_id = getattr(question, "category_id", 1)
    if not isinstance(category_id, int):
        category_id = 1
    difficulty = getattr(question, "difficulty", "Easy")
    if not isinstance(difficulty, str):
        difficulty = "Easy"
    maximum_score = getattr(question, "maximum_score", 0)
    try:
        maximum_score = float(maximum_score)
    except (TypeError, ValueError):
        maximum_score = 0
    tags = getattr(question, "tags", []) or []
    if not isinstance(tags, list):
        tags = []
    return {
        "question_bank_id": getattr(question, "question_bank_id", 0),
        "title": getattr(question, "title", ""),
        "content": getattr(question, "content", ""),
        "type": question_type_value,
        "maximum_score": maximum_score,
        "tags": tags,
        "category_id": category_id,
        "difficulty": difficulty,
    }


@router.post(
    "/source",
    response_model=QuestionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_source_question(
    payload: QuestionCreation,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    if current_user.get("role") != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "Only recruiters can add source questions."
            ),
        )

    question = create_source_question(db, payload)

    return build_question_response(question)


@router.get("/", status_code=status.HTTP_200_OK)
async def list_questions(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can get all source questions."
        )
    questions = get_all_questions(db)
    return [build_question_response(q) for q in questions]


@router.get("/filter", status_code=status.HTTP_200_OK)
async def filter_questions(
    tags: Optional[str] = Query(None, description="Comma-separated tags"),
    difficulty: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):

    if current_user.get("role") != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can view or get filtered source questions."
        )

    if not tags and not difficulty and category_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "At least one filter (tags, difficulty, or category_id) is "
                "required."
            ),
        )

    tag_list = [tag.strip() for tag in tags.split(",")] if tags else None
    questions = get_filtered_questions(
        db=db,
        tags=tag_list,
        difficulty=difficulty,
        category_id=category_id,
    )

    return [build_question_response(q) for q in questions]


@router.post(
    "/source/execute",
    response_model=CodingReferenceExecutionResponse,
    status_code=status.HTTP_200_OK,
)
async def execute_source_question_reference(
    payload: CodingReferenceExecutionRequest,
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can run source question code.",
        )
    return execute_reference_implementation(
        question_metadata=payload.question_metadata,
        implementation=payload.implementation,
        input_data=payload.input_data,
        language=payload.language,
        version=payload.version,
    )


@router.patch(
    "/source/{question_bank_id}",
    response_model=QuestionResponse,
    status_code=status.HTTP_200_OK,
)
async def edit_source_question(
    question_bank_id: int,
    payload: QuestionUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):

    if current_user.get("role") != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can edit source questions."
        )
    question = update_question(db, question_bank_id, payload)
    return build_question_response(question)
