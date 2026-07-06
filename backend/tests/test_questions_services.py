from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.schema.question import QuestionCreation, QuestionUpdate
from app.services.question_management import create_source_question, get_all_questions, get_filtered_questions, update_question

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
    assert question.type.value == "FILL_IN_THE_BLANK"
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

def test_get_filtered_questions_by_all_filters_success():
    mock_db = MagicMock()
    mock_question = MagicMock()
    mock_question.question_bank_id = 1
    mock_question.title = "Python Basics"
    mock_question.type.value = "TEXT"
    mock_question.tags = ["python"]
    mock_db.query.return_value.filter.return_value.filter.return_value.filter.return_value.order_by.return_value.all.return_value = [
        mock_question
    ]
    questions = get_filtered_questions(
        mock_db,
        tags=["python"],
        difficulty="Easy",
        category_id=1,
    )

    assert len(questions) == 1
    assert questions[0].title == "Python Basics"



def test_update_question_success():
    mock_db = MagicMock()
    mock_question = MagicMock()
    mock_question.question_bank_id = 1
    mock_question.title = "Old title"
    mock_question.content = "Old content"
    mock_question.type.value = "TEXT"
    mock_question.maximum_score = 5
    mock_question.tags = ["old"]
    mock_category = MagicMock()
    question_query = MagicMock()
    category_query = MagicMock()
    question_query.filter.return_value.first.return_value = mock_question
    category_query.filter.return_value.first.return_value = mock_category
    mock_db.query.side_effect = [question_query, category_query]
    payload = QuestionUpdate(
        title="New title",
        content="New content",
        type="TEXT",
        maximum_score=10,
        correct_answer=None,
        question_metadata={},
        tags=["python"],
        category_id=1,
        difficulty="Easy",
    )
    question = update_question(mock_db, 1, payload)
    assert question.title == "New title"
    assert question.content == "New content"
    assert question.maximum_score == 10
    assert question.tags == ["python"]
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()

def test_update_question_raises_404_when_question_not_found():
    mock_db = MagicMock()
    question_query = MagicMock()
    question_query.filter.return_value.first.return_value = None
    mock_db.query.return_value = question_query
    payload = QuestionUpdate(
        title="New title",
        content="New content",
        type="TEXT",
        maximum_score=10,
        correct_answer=None,
        question_metadata={},
        tags=["python"],
        category_id=None,
        difficulty="Easy",
    )
    with pytest.raises(HTTPException) as output:
        update_question(mock_db, 999, payload)
    
    assert output.value.status_code == 404
    assert output.value.detail == "Question not found"

def test_update_question_raises_404_when_category_not_found():
    mock_db = MagicMock()
    mock_question = MagicMock()
    question_query = MagicMock()
    category_query = MagicMock()
    # Question exists
    question_query.filter.return_value.first.return_value = mock_question
    # Category does not exist
    category_query.filter.return_value.first.return_value = None
    mock_db.query.side_effect = [question_query, category_query]
    payload = QuestionUpdate(
        title="New title",
        content="New content",
        type="TEXT",
        maximum_score=10,
        correct_answer=None,
        question_metadata={},
        tags=["python"],
        category_id=99,  # category does not exist
        difficulty="Easy",
    )

    with pytest.raises(HTTPException) as output:
        update_question(mock_db, 1, payload)
    assert output.value.status_code == 404
    assert output.value.detail == "Question category not valid/found"

def test_update_question_updates_correct_answer():
    mock_db = MagicMock()
    mock_question = MagicMock()
    mock_category = MagicMock()
    question_query = MagicMock()
    category_query = MagicMock()
    question_query.filter.return_value.first.return_value = mock_question
    category_query.filter.return_value.first.return_value = mock_category
    mock_db.query.side_effect = [question_query, category_query]
    payload = QuestionUpdate(
        title=None,
        content=None,
        type=None,
        maximum_score=None,
        correct_answer={"answer": "option_a"},#we will use a correct answer
        question_metadata=None,
        tags=None,
        category_id=1,
        difficulty=None,
    )
    question = update_question(mock_db, 1, payload)
    assert question.correct_answer == {"answer": "option_a"}
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()