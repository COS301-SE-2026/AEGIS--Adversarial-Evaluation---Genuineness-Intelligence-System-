from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database.database import get_db
from app.schema.question import QuestionCreation, QuestionResponse
from app.services.question_management import create_source_question

router = APIRouter(prefix="/questions", tags=["questions"])


@router.post(
    "/source",
    response_model=QuestionResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_source_question(payload: QuestionCreation,db: Session = Depends(get_db),
                              current_user: dict = Depends(get_current_user),):

    if current_user.get("role") != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can add source questions to the question bank.",)

    question = create_source_question(db, payload)

    return {
        "question_bank_id": question.question_bank_id,
        "title": question.title,
        "content": question.content,
        "type": question.type.value,
        "maximum_score": question.maximum_score,
        "tags": question.tags or [],
    }