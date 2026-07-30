from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.coding_test_cases import CodingTestCase
from app.models.question_bank import QuestionBank, QuestionType
from app.schema.test_cases import CodingTestCaseCreate, CodingTestCaseUpdate


def get_test_cases_by_question_id(
    db: Session,
    question_id: int
) -> list[CodingTestCase]:
    return (
        db.query(CodingTestCase)
        .filter(CodingTestCase.question_id == question_id)
        .order_by(CodingTestCase.test_case_id)
        .all())


def get_source_question(
    db: Session,
    question_id: int,
) -> QuestionBank:
    question = (
        db.query(QuestionBank)
        .filter(QuestionBank.question_bank_id == question_id)
        .first()
    )
    if question is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source question not found",
        )
    if question.type != QuestionType.CODING:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Test cases only managed with coding source questions.",
        )
    return question


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
            detail="Test case not found."
        )
    return test_case


def create_test_case(
        db: Session,
        question_id: int,
        payload: CodingTestCaseCreate
) -> CodingTestCase:
    get_source_question(db, question_id)
    new_test_case = CodingTestCase(
        question_id=question_id,
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
        question_id: int
) -> None:
    get_source_question(db, question_id)
    test_case = get_test_case(
        db,
        test_case_id
    )
    if test_case.question_id != question_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Test case not linked to this source question"
        )
    db.delete(test_case)
    db.commit()


def update_test_case(
        db: Session,
        question_id: int,
        test_case_id: int,
        payload: CodingTestCaseUpdate
) -> CodingTestCase:
    get_source_question(db, question_id)
    test_case = (
        get_test_case(db, test_case_id)
    )
    if test_case.question_id != question_id:
        raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Test case is not linked to that source question"
        )
    if payload.description is not None:
        test_case.description = payload.description
    if payload.input_data is not None:
        test_case.input_data = payload.input_data
    if payload.expected_output is not None:
        test_case.expected_output = payload.expected_output
    if payload.is_hidden is not None:
        test_case.is_hidden = payload.is_hidden
    db.commit()
    db.refresh(test_case)
    return test_case
