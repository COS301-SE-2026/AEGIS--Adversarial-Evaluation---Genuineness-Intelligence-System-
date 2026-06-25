from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database.database import get_db
from app.schema.category import CategoryResponse
from app.services.question import get_all_categories, delete_source_question
from app.core.security import get_current_user

router = APIRouter(prefix="/questions", tags=["question"])
category_router = APIRouter(prefix="/categories", tags=["categories"])


@category_router.get(
    "/",
    response_model=List[CategoryResponse],
    status_code=status.HTTP_200_OK,
    summary="Get all question categories"
)
async def list_categories(
    db: Session = Depends(get_db)
):
    return get_all_categories(db)


@router.delete(
    "/{question_id}",
    status_code=status.HTTP_204_NO_CONTENT,
    summary="Delete a source question"
)
async def delete_question(
    question_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    user_role = current_user.get("role")
    if user_role != "recruiter":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters are allowed to delete questions"
        )

    delete_source_question(db, question_id)
