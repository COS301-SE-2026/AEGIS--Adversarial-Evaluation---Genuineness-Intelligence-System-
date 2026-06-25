from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.schema.question import QuestionCreation
from app.services.question_management import create_source_question

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