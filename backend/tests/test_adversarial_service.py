import json
from unittest.mock import MagicMock, patch

import pytest
from fastapi import HTTPException

from app.models.adversarial_question import AdversarialQuestion
from app.models.adversarial_strategies import AdversarialStrategy
from app.models.assessment import Assessment
from app.models.question_bank import QuestionBank
from app.services.adversarial_service import (
    generate_adversarial_question,
    get_adversarial_questions_for_assessment,
    get_all_adversarial_questions,
    get_all_strategies,
    verify_assessment_exists,
)

VALID_RESPONSE = {
    "weaponised_question": "What does f(6) return?",
    "correct_answer": "8",
    "predicted_wrong_answer": "13",
    "trap_mechanism": "Irrelevant context distracts the model.",
    "pattern_used": "SYMBOL_REDEFINITION",
}


def _mock_db(question_result=None, strategy_result=None):
    mock_db = MagicMock()

    def query_side_effect(model):
        mock_query = MagicMock()
        if model is QuestionBank:
            mock_query.filter.return_value.first.return_value = (
                question_result
            )
        elif model is AdversarialStrategy:
            mock_query.filter.return_value.first.return_value = (
                strategy_result
            )
        return mock_query

    mock_db.query.side_effect = query_side_effect
    return mock_db


def _mock_question():
    question = MagicMock()
    question.question_bank_id = 1
    question.title = "Fibonacci helper"
    question.difficulty = "Easy"
    return question


def _mock_strategy():
    strategy = MagicMock()
    strategy.strategy_id = 2
    strategy.strategy_name = "SYMBOL_REDEFINITION"
    return strategy


def test_generate_adversarial_question_404_when_source_missing():
    mock_db = _mock_db(question_result=None, strategy_result=None)

    with pytest.raises(HTTPException) as exc_info:
        generate_adversarial_question(
            mock_db,
            source_question_id=999,
            strategy_id=1,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Source question not found"


def test_generate_adversarial_question_404_when_strategy_missing():
    mock_db = _mock_db(
        question_result=_mock_question(),
        strategy_result=None,
    )

    with pytest.raises(HTTPException) as exc_info:
        generate_adversarial_question(
            mock_db,
            source_question_id=1,
            strategy_id=999,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Adversarial strategy not found"


def test_generate_adversarial_question_422_on_invalid_json():
    mock_db = _mock_db(
        question_result=_mock_question(),
        strategy_result=_mock_strategy(),
    )
    mock_model = MagicMock()
    mock_model.generate_content.return_value = MagicMock(
        text="not valid json",
    )

    with patch(
        "app.services.adversarial_service.get_gemini_model",
        return_value=mock_model,
    ):
        with pytest.raises(HTTPException) as exc_info:
            generate_adversarial_question(
                mock_db,
                source_question_id=1,
                strategy_id=2,
            )

    assert exc_info.value.status_code == 422


def test_generate_adversarial_question_422_on_missing_fields():
    mock_db = _mock_db(
        question_result=_mock_question(),
        strategy_result=_mock_strategy(),
    )
    incomplete = {
        "weaponised_question": "What does f(6) return?",
        "correct_answer": "8",
    }
    mock_model = MagicMock()
    mock_model.generate_content.return_value = MagicMock(
        text=json.dumps(incomplete),
    )

    with patch(
        "app.services.adversarial_service.get_gemini_model",
        return_value=mock_model,
    ):
        with pytest.raises(HTTPException) as exc_info:
            generate_adversarial_question(
                mock_db,
                source_question_id=1,
                strategy_id=2,
            )

    assert exc_info.value.status_code == 422


def test_generate_adversarial_question_success():
    mock_db = _mock_db(
        question_result=_mock_question(),
        strategy_result=_mock_strategy(),
    )
    mock_model = MagicMock()
    mock_model.generate_content.return_value = MagicMock(
        text=json.dumps(VALID_RESPONSE),
    )

    with patch(
        "app.services.adversarial_service.get_gemini_model",
        return_value=mock_model,
    ) as mock_get_model:
        result = generate_adversarial_question(
            mock_db,
            source_question_id=1,
            strategy_id=2,
        )

    mock_get_model.assert_called_once()
    assert result.source_question_id == 1
    assert result.strategy_id == 2
    assert result.llm == "gemini-2.5-flash"
    assert result.content == VALID_RESPONSE["weaponised_question"]
    mock_db.add.assert_called_once()
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once()


def test_get_all_strategies_returns_list():
    strategies = [_mock_strategy(), _mock_strategy()]
    mock_db = MagicMock()
    mock_db.query.return_value.all.return_value = strategies

    result = get_all_strategies(mock_db)

    mock_db.query.assert_called_once_with(AdversarialStrategy)
    assert result == strategies


def test_get_all_adversarial_questions_returns_list():
    questions = [MagicMock(), MagicMock()]
    mock_db = MagicMock()
    mock_db.query.return_value.all.return_value = questions

    result = get_all_adversarial_questions(mock_db)

    mock_db.query.assert_called_once_with(AdversarialQuestion)
    assert result == questions


def test_verify_assessment_exists_returns_assessment():
    mock_assessment = MagicMock(spec=Assessment)
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = (
        mock_assessment
    )

    result = verify_assessment_exists(mock_db, assessment_id=1)

    assert result is mock_assessment


def test_verify_assessment_exists_404_when_missing():
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = (
        None
    )

    with pytest.raises(HTTPException) as exc_info:
        verify_assessment_exists(mock_db, assessment_id=999)

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Assessment not found"


def _mock_db_for_questions(assessment_result, questions_result):
    mock_db = MagicMock()

    def query_side_effect(model):
        mock_query = MagicMock()
        if model is Assessment:
            mock_query.filter.return_value.first.return_value = (
                assessment_result
            )
        elif model is AdversarialQuestion:
            join_query = mock_query.join.return_value
            join_query.filter.return_value.all.return_value = (
                questions_result
            )
        return mock_query

    mock_db.query.side_effect = query_side_effect
    return mock_db


def test_get_adversarial_questions_404_when_assessment_missing():
    mock_db = _mock_db_for_questions(
        assessment_result=None,
        questions_result=[],
    )

    with pytest.raises(HTTPException) as exc_info:
        get_adversarial_questions_for_assessment(
            mock_db, assessment_id=999
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Assessment not found"


def test_get_adversarial_questions_empty_list():
    mock_assessment = MagicMock(spec=Assessment)
    mock_db = _mock_db_for_questions(
        assessment_result=mock_assessment,
        questions_result=[],
    )

    result = get_adversarial_questions_for_assessment(
        mock_db, assessment_id=1
    )

    assert result == []


def test_get_adversarial_questions_returns_list():
    mock_assessment = MagicMock(spec=Assessment)
    questions = [MagicMock(), MagicMock()]
    mock_db = _mock_db_for_questions(
        assessment_result=mock_assessment,
        questions_result=questions,
    )

    result = get_adversarial_questions_for_assessment(
        mock_db, assessment_id=1
    )

    assert result == questions
