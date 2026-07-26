from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.schema.question import QuestionCreation, QuestionUpdate
from app.services.assessment import execute_reference_implementation
from app.services.question_management import (
    _normalize_fill_in_blank_payload,
    _normalize_mcq_payload,
    create_source_question,
    get_all_questions,
    get_filtered_questions,
    update_question,
)


SQL_JOIN_CONTENT = (
    "Complete the SQL query.\n\n"
    "SELECT DISTINCT u.email\n"
    "FROM users u\n"
    "[A] candidate_assessments ca ON u.user_id = ca.candidate_id;"
)


def _mock_create_question_db():
    mock_db = MagicMock()
    mock_category = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = mock_category
    return mock_db


def _build_sql_join_payload(**overrides) -> QuestionCreation:
    payload_data = {
        "title": "SQL Join Blank",
        "content": SQL_JOIN_CONTENT,
        "type": "TEXT",
        "maximum_score": 5,
        "correct_answer": {"answer": {"A": "INNER JOIN"}},
        "question_metadata": {"blanks": ["A"]},
        "tags": ["sql"],
        "category_id": 1,
        "difficulty": "Easy",
    }
    payload_data.update(overrides)
    return QuestionCreation(**payload_data)


def _assert_sql_join_question(question):
    assert question.title == "SQL Join Blank"
    assert question.content.startswith("Complete the SQL query.")
    assert question.type.value == "FILL_IN_THE_BLANK"
    assert question.question_metadata == {"blanks": ["A"]}
    assert question.correct_answer == {"answer": {"A": "INNER JOIN"}}
    assert question.maximum_score == 5
    assert question.tags == ["sql"]

def test_create_source_question_success():
    mock_db = _mock_create_question_db()
    payload = _build_sql_join_payload()
    question = create_source_question(mock_db, payload)
    _assert_sql_join_question(question)
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()


def test_create_source_question_mcq_success():
    mock_db = MagicMock()
    mock_category = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = mock_category
    payload = QuestionCreation(
        title="Binary Search",
        content="What is the time complexity of binary search?",
        type="MCQ",
        maximum_score=10,
        correct_answer={"answer": "C"},
        question_metadata={
            "options": {
                "A": "O(n)",
                "B": "O(n log n)",
                "C": "O(log n)",
                "D": "O(1)",
            }
        },
        tags=["algorithms"],
        category_id=1,
        difficulty="Easy",
    )
    question = create_source_question(mock_db, payload)
    assert question.title == "Binary Search"
    assert question.content == "What is the time complexity of binary search?"
    assert question.type.value == "MULTIPLE_CHOICE"
    assert question.question_metadata == {
        "options": {
            "A": "O(n)",
            "B": "O(n log n)",
            "C": "O(log n)",
            "D": "O(1)",
        }
    }
    assert question.correct_answer == {"answer": "C"}
    assert question.tags == ["algorithms"]
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()


def test_create_source_question_fill_in_blank_success():
    mock_db = _mock_create_question_db()
    payload = _build_sql_join_payload()
    question = create_source_question(mock_db, payload)
    _assert_sql_join_question(question)
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()


def test_normalize_mcq_payload_rejects():
    with pytest.raises(HTTPException) as exc_info:
        _normalize_mcq_payload(None, {"answer": "A"})
    assert exc_info.value.status_code == 422
    assert exc_info.value.detail == "MCQ questions require question_metadata.options."


def test_execute_reference_implementation_rejects_missing_function_name():
    with pytest.raises(HTTPException) as exc_info:
        execute_reference_implementation(
            question_metadata={"function_signature": "def (nums, target)"},
            implementation="def solve():\n    pass\n",
            input_data="[]",
            piston_client=MagicMock(),
        )
    assert exc_info.value.status_code == 422
    assert exc_info.value.detail == (
        "Coding questions require a valid function_name or function_signature."
    )


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

def test_normalize_mcq_payload_rejects():
    with pytest.raises(HTTPException) as exc_info:
        _normalize_mcq_payload({}, {"answer": "A"})
    assert exc_info.value.status_code == 422
    assert exc_info.value.detail == "MCQ questions require question_metadata.options"


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

def test_execute_reference_implementation_rejects_empty_implementation():
    with pytest.raises(HTTPException) as exc_info:
        execute_reference_implementation(
            question_metadata={"function_name": "two_sum"},
            implementation="   ",
            input_data="[]",
            piston_client=MagicMock(),
        )

    assert exc_info.value.status_code == 422
    assert exc_info.value.detail == "Coding questions require a reference implementation."


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


def test_normalize_fill_in_blank_payload_rejects_answer_object():
    with pytest.raises(HTTPException) as exc_info:
        _normalize_fill_in_blank_payload({"blanks": ["A"]}, {"answer": "JOIN"})
    assert exc_info.value.status_code == 422
    assert exc_info.value.detail == (
        "Fill-in-the-blank correct_answer.answer must be an object.",
    )


def test_update_question_success():
    mock_db = MagicMock()
    mock_question = MagicMock()
    mock_question.question_bank_id = 1
    mock_question.title = "Old title"
    mock_question.content = "Old content"
    mock_question.type.value = "FILL_IN_THE_BLANK"
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
        content=(
            "Complete the SQL query.\n\n"
            "SELECT DISTINCT u.email\n"
            "FROM users u\n"
            "[A] candidate_assessments ca ON u.user_id = ca.candidate_id;"
        ),
        type="TEXT",
        maximum_score=7,
        correct_answer={"answer": {"A": "INNER JOIN"}},
        question_metadata={"blanks": ["A"]},
        tags=["sql"],
        category_id=1,
        difficulty="Easy",
    )
    question = update_question(mock_db, 1, payload)
    assert question.title == "New title"
    assert question.content.startswith("Complete the SQL query.")
    assert question.type.value == "FILL_IN_THE_BLANK"
    assert question.question_metadata == {"blanks": ["A"]}
    assert question.correct_answer == {"answer": {"A": "INNER JOIN"}}
    assert question.maximum_score == 7
    assert question.tags == ["sql"]
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()

def test_normalize_fill_in_blank_payload_rejects_missing_metadata():
    with pytest.raises(HTTPException) as exc_info:
        _normalize_fill_in_blank_payload(None, {"answer": {"A": "JOIN"}})
    assert exc_info.value.status_code == 422
    assert exc_info.value.detail == "Fill-in-the-blank questions require question_metadata.blanks."
    

def test_update_question_mcq_success():
    mock_db = MagicMock()
    mock_question = MagicMock()
    mock_question.question_bank_id = 1
    mock_question.title = "Old title"
    mock_question.content = "Old content"
    mock_question.type.value = "MULTIPLE_CHOICE"
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
        content="New content bruv",
        type="MCQ",
        maximum_score=10,
        correct_answer={"answer": "B"},
        question_metadata={
            "options": {
                "A": "Option A",
                "B": "Option B",
                "C": "Option C",
                "D": "Option D",
            }
        },
        tags=["python"],
        category_id=1,
        difficulty="Easy",
    )
    question = update_question(mock_db, 1, payload)
    assert question.title == "New title"
    assert question.content == "New content bruv"
    assert question.type.value == "MULTIPLE_CHOICE"
    assert question.question_metadata == {
        "options": {
            "A": "Option A",
            "B": "Option B",
            "C": "Option C",
            "D": "Option D",
        }
    }
    assert question.correct_answer == {"answer": "B"}
    assert question.maximum_score == 10
    assert question.tags == ["python"]
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()

def test_normalize_mcq_payload_rejects_invalid_answer_container():
    with pytest.raises(HTTPException) as exc_info:
        _normalize_mcq_payload({"options": {"A": "One", "B": "Two", "C": "Three", "D": "Four"}}, "A")
    assert exc_info.value.status_code == 422
    assert exc_info.value.detail == "MCQ questions require correct_answer.answer."


def test_update_question_fill_in_blank_success():
    mock_db = MagicMock()
    mock_question = MagicMock()
    mock_question.question_bank_id = 1
    mock_question.title = "Old title"
    mock_question.content = "Old content"
    mock_question.type.value = "FILL_IN_THE_BLANK"
    mock_question.maximum_score = 5
    mock_question.tags = ["old"]
    mock_category = MagicMock()
    question_query = MagicMock()
    category_query = MagicMock()
    question_query.filter.return_value.first.return_value = mock_question
    category_query.filter.return_value.first.return_value = mock_category
    mock_db.query.side_effect = [question_query, category_query]
    payload = QuestionUpdate(
        title="New blank title",
        content=(
            "Complete the SQL query.\n\n"
            "SELECT DISTINCT u.email\n"
            "FROM users u\n"
            "[A] candidate_assessments ca ON u.user_id = ca.candidate_id;"
        ),
        type="TEXT",
        maximum_score=7,
        correct_answer={"answer": {"A": "INNER JOIN"}},
        question_metadata={"blanks": ["A"]},
        tags=["sql"],
        category_id=1,
        difficulty="Easy",
    )
    question = update_question(mock_db, 1, payload)
    assert question.title == "New blank title"
    assert question.content.startswith("Complete the SQL query.")
    assert question.type.value == "FILL_IN_THE_BLANK"
    assert question.question_metadata == {"blanks": ["A"]}
    assert question.correct_answer == {"answer": {"A": "INNER JOIN"}}
    assert question.maximum_score == 7
    assert question.tags == ["sql"]
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()

def test_normalize_fill_in_blank_payload_rejects_mismatched_labels():
    with pytest.raises(HTTPException) as exc_info:
        _normalize_fill_in_blank_payload({"blanks": ["A"]}, {"answer": {"A": "JOIN", "B": "EXTRA"}})
    assert exc_info.value.status_code == 422
    assert exc_info.value.detail == (
        "Fill-in-the-blank answers must match the configured blank labels.",
    )


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