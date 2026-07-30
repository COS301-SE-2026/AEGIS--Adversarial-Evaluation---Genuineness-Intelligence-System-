import pytest

from app.models import QuestionBank, QuestionCategory, QuestionType

pytestmark = pytest.mark.integration


def test_question_bank_row_round_trips_through_real_db(db_session):
    category = QuestionCategory(category_name="Smoke Test Category")
    db_session.add(category)
    db_session.flush()

    question = QuestionBank(
        title="Smoke test question",
        content="What is 2 + 2?",
        type=QuestionType.FILL_IN_THE_BLANK,
        maximum_score=1.0,
        correct_answer="4",
        category_id=category.category_id,
    )
    db_session.add(question)
    db_session.commit()

    fetched = (
        db_session.query(QuestionBank)
        .filter_by(title="Smoke test question")
        .one()
    )
    assert fetched.content == "What is 2 + 2?"
    assert fetched.maximum_score == 1.0
    assert fetched.category_id == category.category_id


def test_previous_test_rows_were_rolled_back(db_session):
    leftover = (
        db_session.query(QuestionBank)
        .filter_by(title="Smoke test question")
        .first()
    )
    assert leftover is None
