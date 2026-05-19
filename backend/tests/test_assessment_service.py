from datetime import datetime
from unittest.mock import MagicMock

from app.services.assessment import (
    get_all_assessments,
    get_assessment_by_id,
)


def _make_mock_db_for_all(assessments):
    mock_db = MagicMock()
    mock_db.query.return_value.all.return_value = assessments
    return mock_db


def _make_mock_db_for_by_id(assessment):
    mock_db = MagicMock()
    (
        mock_db.query.return_value
        .options.return_value
        .filter.return_value
        .first.return_value
    ) = assessment
    return mock_db


def test_get_all_assessments_returns_list():
    mock_db = _make_mock_db_for_all([])
    result = get_all_assessments(mock_db)
    assert isinstance(result, list)


def test_get_all_assessments_returns_empty_list():
    mock_db = _make_mock_db_for_all([])
    result = get_all_assessments(mock_db)
    assert result == []


def test_get_all_assessments_items_have_required_fields():
    mock_a = MagicMock()
    mock_a.assessment_id = 1
    mock_a.title = "Test Assessment"
    mock_a.description = "A description"
    mock_a.duration_mins = 60
    mock_a.created_at = datetime(2025, 1, 1)

    mock_db = _make_mock_db_for_all([mock_a])
    result = get_all_assessments(mock_db)

    assert len(result) == 1
    item = result[0]
    assert item.assessment_id == 1
    assert item.title == "Test Assessment"
    assert item.description == "A description"
    assert item.duration_mins == 60
    assert item.created_at == datetime(2025, 1, 1)


def test_get_assessment_by_id_returns_none_when_not_found():
    mock_db = _make_mock_db_for_by_id(None)
    result = get_assessment_by_id(mock_db, 999)
    assert result is None


def test_get_assessment_by_id_returns_correct_assessment():
    mock_a = MagicMock()
    mock_a.assessment_id = 42
    mock_a.assessment_questions = []

    mock_db = _make_mock_db_for_by_id(mock_a)
    result = get_assessment_by_id(mock_db, 42)

    assert result is not None
    assert result.assessment_id == 42


def test_get_assessment_by_id_includes_questions_list():
    mock_aq = MagicMock()
    mock_aq.display_order = 1

    mock_a = MagicMock()
    mock_a.assessment_id = 1
    mock_a.assessment_questions = [mock_aq]

    mock_db = _make_mock_db_for_by_id(mock_a)
    result = get_assessment_by_id(mock_db, 1)

    assert hasattr(result, "assessment_questions")
    assert isinstance(result.assessment_questions, list)
    assert len(result.assessment_questions) == 1


def test_get_assessment_by_id_questions_ordered_by_display_order():
    aq1 = MagicMock()
    aq1.display_order = 3
    aq2 = MagicMock()
    aq2.display_order = 1
    aq3 = MagicMock()
    aq3.display_order = 2

    mock_a = MagicMock()
    mock_a.assessment_questions = [aq1, aq2, aq3]

    mock_db = _make_mock_db_for_by_id(mock_a)
    result = get_assessment_by_id(mock_db, 1)

    orders = [aq.display_order for aq in result.assessment_questions]
    assert orders == [1, 2, 3]


def test_get_assessment_by_id_null_display_order_sorts_last():
    aq_null = MagicMock()
    aq_null.display_order = None
    aq_first = MagicMock()
    aq_first.display_order = 1

    mock_a = MagicMock()
    mock_a.assessment_questions = [aq_null, aq_first]

    mock_db = _make_mock_db_for_by_id(mock_a)
    result = get_assessment_by_id(mock_db, 1)

    assert result.assessment_questions[0].display_order == 1
    assert result.assessment_questions[1].display_order is None


def test_get_assessment_by_id_each_question_has_required_fields():
    mock_qb = MagicMock()
    mock_qb.question_bank_id = 10
    mock_qb.title = "What is X?"
    mock_qb.content = "Explain X in detail."
    mock_qb.type.value = "TEXT"
    mock_qb.maximum_score = 5.0
    mock_qb.tags = ["python", "oop"]

    mock_aq = MagicMock()
    mock_aq.assessment_q_id = 7
    mock_aq.display_order = 1
    mock_aq.marks = 5.0
    mock_aq.question_bank = mock_qb

    mock_a = MagicMock()
    mock_a.assessment_questions = [mock_aq]

    mock_db = _make_mock_db_for_by_id(mock_a)
    result = get_assessment_by_id(mock_db, 1)

    aq = result.assessment_questions[0]
    assert aq.assessment_q_id == 7
    assert aq.display_order == 1
    assert aq.marks == 5.0
    assert aq.question_bank.question_bank_id == 10
    assert aq.question_bank.title == "What is X?"
    assert aq.question_bank.content == "Explain X in detail."
    assert aq.question_bank.type.value == "TEXT"
    assert aq.question_bank.maximum_score == 5.0
    assert aq.question_bank.tags == ["python", "oop"]
