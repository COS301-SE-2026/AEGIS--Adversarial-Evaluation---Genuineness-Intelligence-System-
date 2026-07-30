from unittest.mock import MagicMock
import pytest
from fastapi import HTTPException, status

from app.services.question import get_all_categories, delete_source_question

def _mock_da_db(results):
    mock_db = MagicMock()
    mock_db.query.return_value.all.return_value = results
    return mock_db

def test_all_categories_empty_list():
    mock_db = _mock_da_db([])
    result = get_all_categories(mock_db)
    assert result == []

def test_return_all_categories():
    category1 = MagicMock()
    category1.category_id = 1
    category1.category_name = "Algorithms"
    category1.created_at = "2024-01-15T10:30:00"

    category2 = MagicMock()
    category2.category_id = 2
    category2.category_name = "Data Structures"
    category2.created_at = "2024-01-15T10:30:00"

    mock_db = _mock_da_db([category1, category2])
    result = get_all_categories(mock_db)

    assert len(result) == 2
    assert result[0].category_name == "Algorithms"
    assert result[1].category_name == "Data Structures"

def test_required_fields():
    mock_category = MagicMock()
    mock_category.category_id = 1
    mock_category.category_name = "Web Development"
    mock_category.created_at = "2024-01-15T10:30:00"

    mock_db = _mock_da_db([mock_category])
    result = get_all_categories(mock_db)

    assert len(result) == 1
    category = result[0]
    assert hasattr(category, "category_id")
    assert hasattr(category, "category_name")
    assert hasattr(category, "created_at")

def _mock_delete_db(question=None, adversarial=[], test_cases=[]):
    mock_db = MagicMock()

    def query_side_effect(model):
        from app.models.question_bank import QuestionBank
        from app.models.adversarial_question import AdversarialQuestion
        from app.models.coding_test_cases import CodingTestCase

        mock_query = MagicMock()

        if model is QuestionBank:
            mock_query.filter.return_value.first.return_value = question
        elif model is AdversarialQuestion:
            mock_query.filter.return_value.all.return_value = adversarial
        elif model is CodingTestCase:
            mock_query.filter.return_value.all.return_value = test_cases
        
        return mock_query

    mock_db.query.side_effect = query_side_effect
    return mock_db


def test_delete_question_not_found():
    mock_db = _mock_delete_db(question=None)

    with pytest.raises(HTTPException) as exc:
        delete_source_question(mock_db, question_id=9999)

    assert exc.value.status_code == status.HTTP_404_NOT_FOUND


def test_delete_question_blocked_by_adversarial():
    mock_question = MagicMock()
    mock_adversarial = [MagicMock()]
    mock_db = _mock_delete_db(question=mock_question, adversarial=mock_adversarial)

    with pytest.raises(HTTPException) as exc:
        delete_source_question(mock_db, question_id=1)

    assert exc.value.status_code == status.HTTP_400_BAD_REQUEST


def test_delete_question_blocked_by_test_cases():
    mock_question = MagicMock()
    mock_test_cases = [MagicMock()]
    mock_db = _mock_delete_db(question=mock_question, adversarial=[], test_cases=mock_test_cases)

    delete_source_question(mock_db, question_id=1)

    mock_db.delete.assert_any_call(mock_test_cases[0])
    mock_db.delete.assert_any_call(mock_question)
    assert mock_db.delete.call_count == 2
    mock_db.commit.assert_called_once()


def test_delete_question_success():
    mock_question = MagicMock()
    mock_test_case = MagicMock()
    mock_db = _mock_delete_db(question=mock_question, adversarial=[], test_cases=[mock_test_case])

    delete_source_question(mock_db, question_id=1)

    mock_db.delete.assert_any_call(mock_test_case)
    mock_db.delete.assert_any_call(mock_question)
    assert mock_db.delete.call_count == 2
    mock_db.commit.assert_called_once()
