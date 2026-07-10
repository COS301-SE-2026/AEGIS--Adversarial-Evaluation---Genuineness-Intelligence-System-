from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.coding_test_cases import CodingTestCase
from app.models.question_bank import QuestionBank


def get_test_cases_by_question_id(
    db: Session,
    question_id: int
) -> list[CodingTestCase]:
    question = (
        db.query(QuestionBank)
        .filter(QuestionBank.question_bank_id == question_id)
        .first())
    if question is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test Case Not Found as Question not found")
    return (
        db.query(CodingTestCase)
        .filter(CodingTestCase.question_id == question_id)
        .order_by(CodingTestCase.test_case_id)
        .all())
