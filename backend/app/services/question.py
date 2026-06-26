from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.question_category import QuestionCategory
from app.models.question_bank import QuestionBank
from app.models.adversarial_question import AdversarialQuestion
from app.models.coding_test_cases import CodingTestCase


def get_all_categories(db: Session) -> list:
    return db.query(QuestionCategory).all()


def delete_source_question(db: Session, question_id: int) -> None:
    question = db.query(QuestionBank).filter(
        QuestionBank.question_bank_id == question_id
    ).first()

    if not question:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Question not found"
        )

    related_questions = db.query(AdversarialQuestion).filter(
        AdversarialQuestion.source_question_id == question_id
    ).all()

    if related_questions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This question was used to generate an adversarial quesiton"
        )

    test_cases = db.query(CodingTestCase).filter(
        CodingTestCase.question_id == question_id
    ).all()

    if test_cases:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question has asssociated test cases"
        )

    db.delete(question)
    db.commit()
