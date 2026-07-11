from unittest.mock import MagicMock
import pytest
from fastapi import HTTPException
from app.models.coding_test_cases import CodingTestCase
from app.models.question_bank import QuestionBank
from app.services.test_cases import get_test_cases_by_question_id

def make_mock_db(question_result, test_cases_result):
    mock_db = MagicMock()
    def query_side_effect(model):
        mock_query = MagicMock()
        if model is QuestionBank:
            mock_query.filter.return_value.first.return_value = question_result
        elif model is CodingTestCase:
            mock_query.filter.return_value.order_by.return_value.all.return_value = (
                test_cases_result
            )
        return mock_query
    mock_db.query.side_effect = query_side_effect
    return mock_db

def test_get_test_cases_by_question_id_returns_list():
    mock_question = MagicMock()
    mock_question.question_bank_id = 1
    mock_case = MagicMock()
    mock_case.test_case_id = 10
    mock_case.question_id = 1
    mock_case.description = "simple case"
    mock_case.input_data = "1"
    mock_case.expected_output = "1"
    mock_case.is_hidden = True
    mock_db = make_mock_db(mock_question, [mock_case])
    result = get_test_cases_by_question_id(mock_db, question_id=1)
    assert isinstance(result, list)
    assert len(result) == 1
    assert result[0].test_case_id == 10
    assert result[0].question_id == 1

def test_cases_raises_404():
    mock_db = make_mock_db(None, [])
    with pytest.raises(HTTPException) as exc_info:
        get_test_cases_by_question_id(mock_db, question_id=999)
    assert exc_info.value.status_code == 404