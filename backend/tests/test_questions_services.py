from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.schema.question import QuestionCreation
from app.services.question_management import create_source_question, get_all_questions, get_filtered_questions

def test_create_source_question_success():
    mock_db = MagicMock()
    mock_category = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = mock_category #this is how we chained the SQLAlchemy in our service function
    payload = QuestionCreation(
        title="Python Basics",
        content="What is Python?",
        type="TEXT",
        maximum_score=10,
        correct_answer=None,
        question_metadata={},
        tags=["python"],
        category_id=1,
        difficulty="Easy",
    )
    question = create_source_question(mock_db, payload)
    assert question.title == "Python Basics"
    assert question.content == "What is Python?"
    assert question.type.value == "TEXT"
    assert question.maximum_score == 10
    assert question.tags == ["python"]
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()

def test_get_all_questions_success():
    mock_db = MagicMock()
    mock_question = MagicMock()
    mock_question.question_bank_id = 1
    mock_question.title = "Python Basics"
    mock_question.content = "What is Python?"
    mock_question.type.value = "TEXT"
    mock_question.maximum_score = 10
    mock_question.tags = ["python"]
    mock_db.query.return_value.order_by.return_value.all.return_value = [mock_question]
    questions = get_all_questions(mock_db)
    assert len(questions) == 1
    assert questions[0].title == "Python Basics"
    assert questions[0].type.value == "TEXT"
    mock_db.query.return_value.order_by.assert_called_once()

def test_get_filtered_questions_by_tags_success():
    mock_db = MagicMock()
    mock_question = MagicMock()
    mock_question.question_bank_id = 1
    mock_question.title = "Python Basics"
    mock_question.type.value = "TEXT"
    mock_question.tags = ["python"]
    mock_db.query.return_value.filter.return_value.order_by.return_value.all.return_value = [
        mock_question
    ]
    questions = get_filtered_questions(
        mock_db,
        tags=["python"],
        difficulty=None,
        category_id=None,
    )
    assert len(questions) == 1
    assert questions[0].title == "Python Basics"
    mock_db.query.return_value.filter.assert_called_once()