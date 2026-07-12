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

def get_test_case(
        db: Session,
        test_case_id: int
) -> CodingTestCase:
    test_case = (
        db.query(CodingTestCase)
        .filter(CodingTestCase.test_case_id == test_case_id)
        .first()
    )
    if test_case is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail= "Test case not found."
        )
    return test_case

def create_test_case(
        db: Session,
        adv_question_id: int,
        payload: CodingTestCaseCreate
) -> CodingTestCase:
    adv_question = (
        get_adversarial_question(
            db,
            adv_question_id
        )
    )
    new_test_case = CodingTestCase(
        question_id=adv_question.source_question_id,
        description=payload.description,
        input_data=payload.input_data,
        expected_output=payload.expected_output,
        is_hidden=payload.is_hidden
    )
    db.add(new_test_case)
    db.commit()
    db.refresh(new_test_case)
    return new_test_case

def delete_test_case(
        db: Session,
        test_case_id: int,
        adversarial_question_id: int
) -> None:
    adv_question = get_adversarial_question(
        db,
        adversarial_question_id
    )
    test_case = get_test_case(
        db,
        test_case_id
    )
    if test_case.question_id != adv_question.source_question_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not linked to this adversarial question"
        )
    db.delete(test_case)
    db.commit()
