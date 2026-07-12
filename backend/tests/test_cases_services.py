from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.models.adversarial_question import AdversarialQuestion
from app.models.coding_test_cases import CodingTestCase
from app.models.question_bank import QuestionBank
from app.schema.test_cases import CodingTestCaseCreate, CodingTestCaseUpdate
from app.services.test_cases import (
    create_test_case,
    delete_test_case,
    get_test_cases_by_question_id,
    update_test_case,
)


def _mock_db(
    question_result=None,
    adv_question_result=None,
    test_case_result=None,
    test_cases_result=None,
):
    mock_db = MagicMock()

    def query_side_effect(model):
        mock_query = MagicMock()
        if model is QuestionBank:
            mock_query.filter.return_value.first.return_value = question_result
        elif model is AdversarialQuestion:
            mock_query.filter.return_value.first.return_value = adv_question_result
        elif model is CodingTestCase:
            mock_query.filter.return_value.first.return_value = test_case_result
            mock_query.filter.return_value.order_by.return_value.all.return_value = (
                test_cases_result if test_cases_result is not None else []
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

    mock_db = _mock_db(question_result=mock_question, test_cases_result=[mock_case])
    result = get_test_cases_by_question_id(mock_db, question_id=1)

    assert isinstance(result, list)
    assert len(result) == 1
    assert result[0].test_case_id == 10
    assert result[0].question_id == 1


def test_get_test_cases_raises404():
    mock_db = _mock_db(question_result=None)

    with pytest.raises(HTTPException) as exc_info:
        get_test_cases_by_question_id(mock_db, question_id=999)

    assert exc_info.value.status_code == 404


def test_create_test_case_creates_row_for_adversarial_question():
    mock_adv_question = MagicMock()
    mock_adv_question.source_question_id = 42

    mock_db = _mock_db(adv_question_result=mock_adv_question)
    payload = CodingTestCaseCreate(
        description="add, lets see",
        input_data="5",
        expected_output="10",
        is_hidden=False,
    )
    result = create_test_case(mock_db, adv_question_id=7, payload=payload)
    assert result.question_id == 42
    assert result.description == "add, lets see"
    assert result.input_data == "5"
    assert result.expected_output == "10"
    assert result.is_hidden is False
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()

def test_delete_test_case_deletes_matching_row():
    mock_adv_question = MagicMock()
    mock_adv_question.source_question_id = 42
    mock_case = MagicMock()
    mock_case.question_id = 42
    mock_db = _mock_db(
        adv_question_result=mock_adv_question,
        test_case_result=mock_case,
    )
    delete_test_case(mock_db, test_case_id=10, adversarial_question_id=7)
    mock_db.delete.assert_called_once_with(mock_case)
    mock_db.commit.assert_called_once()

def test_test_case_updates_matching_row():
    mock_adv_question = MagicMock()
    mock_adv_question.source_question_id = 42
    mock_case = MagicMock()
    mock_case.question_id = 42
    mock_case.description = "old"
    mock_case.input_data = "1"
    mock_case.expected_output = "2"
    mock_case.is_hidden = True
    mock_db = _mock_db(
        adv_question_result=mock_adv_question,
        test_case_result=mock_case,
    )
    payload = CodingTestCaseUpdate(
        description="new",
        input_data="5",
        expected_output="10",
        is_hidden=False,
    )
    result = update_test_case(
        mock_db,
        adversarial_question_id=7,
        test_case_id=10,
        payload=payload,
    )
    assert result.description == "new"
    assert result.input_data == "5"
    assert result.expected_output == "10"
    assert result.is_hidden is False
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once_with(mock_case)