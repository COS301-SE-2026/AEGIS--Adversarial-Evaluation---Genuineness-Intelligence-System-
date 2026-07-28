from app.schema.test_cases import (
    CodingTestCaseResponse,
    CodingTestCaseCreate,
    CodingTestCaseUpdate
)
from app.services.test_cases import (
    get_test_cases_by_question_id,
    update_test_case,
    delete_test_case,
    create_test_case
)
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


@router.delete(
    "/source/{question_bank_id}/test-cases/{test_case_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
async def delete_test_case_for_adv_question(
    test_case_id: int,
    question_bank_id: int,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    if user.get("role") != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can delete test cases."
        )
    delete_test_case(db, test_case_id, question_bank_id)


@router.post(
    "/source/{question_bank_id}/test-cases",
    response_model=CodingTestCaseResponse,
    status_code=status.HTTP_201_CREATED
)
async def create_test_case_for_adv_question(
    question_bank_id: int,
    payload: CodingTestCaseCreate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    if user.get("role") != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can create new test cases"
        )
    new_test_case = create_test_case(
        db,
        question_bank_id,
        payload)
    return new_test_case


@router.patch(
    "/source/{question_bank_id}/test-cases/{test_case_id}",
    response_model=CodingTestCaseResponse,
    status_code=status.HTTP_200_OK
)
async def update_test_case_for_adv_question(
    question_bank_id: int,
    test_case_id: int,
    payload: CodingTestCaseUpdate,
    db: Session = Depends(get_db),
    user: dict = Depends(get_current_user)
):
    if user.get("role") != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Recruiters can update test cases."
        )
    return update_test_case(
        db,
        question_bank_id,
        test_case_id,
        payload)
