from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.adversarial_question import AdversarialQuestion
from app.models.coding_test_cases import CodingTestCase
from app.models.question_bank import QuestionBank
from app.schema.test_cases import CodingTestCaseCreate, CodingTestCaseUpdate


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

def get_adversarial_question(
    db: Session,
    adv_question_id: int,
) -> AdversarialQuestion:
    adversarial_question = (
        db.query(AdversarialQuestion)
        .filter(AdversarialQuestion.adv_question_id == adv_question_id)
        .first()
    )
    if adversarial_question is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Adversarial question not found",
        )
    return adversarial_question
