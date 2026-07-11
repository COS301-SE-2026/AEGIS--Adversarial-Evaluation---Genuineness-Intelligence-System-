from app.schema.test_cases import CodingTestCaseResponse
from app.services.test_cases import get_test_cases_by_question_id
from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from app.database.database import get_db
from app.core.security import get_current_user

router = APIRouter(prefix="/questions", tags=["questions"])


@router.get(
    "/source/{question_bank_id}/test-cases",
    response_model=list[CodingTestCaseResponse],
    status_code=status.HTTP_200_OK,
)
async def get_test_cases_for_source_question(
    question_bank_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can view coding test cases.",
        )

    return get_test_cases_by_question_id(db, question_bank_id)
