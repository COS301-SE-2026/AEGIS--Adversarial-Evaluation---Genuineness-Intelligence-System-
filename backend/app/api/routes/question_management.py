from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional
from app.core.security import get_current_user
from app.database.database import get_db
from app.schema.question import QuestionCreation, QuestionResponse, QuestionUpdate
from app.services.question_management import create_source_question,get_all_questions, get_filtered_questions, update_question

router = APIRouter(prefix="/questions", tags=["questions"])


@router.post(
    "/source",
    response_model=QuestionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_source_question(payload: QuestionCreation,db: Session = Depends(get_db),
                              current_user: dict = Depends(get_current_user)):

    if current_user.get("role") != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can add source questions to the question bank.")

    question = create_source_question(db, payload)

    return {
        "question_bank_id": question.question_bank_id,
        "title": question.title,
        "content": question.content,
        "type": question.type.value,
        "maximum_score": question.maximum_score,
        "tags": question.tags or [],
    }

@router.get("/",status_code=status.HTTP_200_OK)

async def list_questions(db:Session = Depends(get_db),current_user: dict = Depends(get_current_user)):
    if current_user.get("role") != "RECRUITER":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can get all source questions.")
    questions = get_all_questions(db)
    return [
        {   "question_bank_id": q.question_bank_id,
            "title": q.title,
            "content": q.content,
            "type": q.type.value,
            "maximum_score": q.maximum_score,
            "tags": q.tags or [],
        }
        for q in questions
    ]

@router.get("/filter",status_code=status.HTTP_200_OK)

async def filter_questions(tags: Optional[str] = Query(None, description="Comma-separated tags"),difficulty: Optional[str] = Query(None),
    category_id: Optional[int] = Query(None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)):

    if current_user.get("role") != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can view or get filtered source questions.",
        )
    
    if not tags and not difficulty and category_id is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="At least one filter (tags, difficulty, or category_id) is required.",
    )
    
    tag_list = [tag.strip() for tag in tags.split(",")] if tags else None
    questions = get_filtered_questions(db=db,tags=tag_list,difficulty=difficulty,category_id=category_id)

    return [
        {   "question_bank_id": q.question_bank_id,
            "title": q.title,
            "content": q.content,
            "type": q.type.value,
            "maximum_score": q.maximum_score,
            "tags": q.tags or [],
        }
        for q in questions
    ]


@router.patch("/source/{question_bank_id}",response_model=QuestionResponse,status_code=status.HTTP_200_OK)
async def edit_source_question(question_bank_id: int, payload: QuestionUpdate, db: Session = Depends(get_db),current_user: dict = Depends(get_current_user)):

    if current_user.get("role") != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can edit source questions.")
    question = update_question(db, question_bank_id, payload)
    return {
        "question_bank_id": question.question_bank_id,
        "title": question.title,
        "content": question.content,
        "type": question.type.value,
        "maximum_score": question.maximum_score,
        "tags": question.tags or [],
    }