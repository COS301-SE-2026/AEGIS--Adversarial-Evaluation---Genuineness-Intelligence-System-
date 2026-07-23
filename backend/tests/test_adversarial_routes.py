from datetime import datetime, timezone
from unittest.mock import MagicMock, patch

from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.core.security import get_current_user
from app.database.database import get_db
from app.main import app

client = TestClient(app)


def _db_override():
    mock_db = MagicMock()
    yield mock_db


def _auth_override(role: str):
    def get_current_user_mock():
        return {"role": role, "user_id": "1", "sub": "test@tuks.co.za"}
    return get_current_user_mock


@patch("app.api.routes.adversarial.get_all_strategies")
def test_list_strategies_returns_data(mock_get_all):
    mock_get_all.return_value = [
        MagicMock(
            strategy_id=1,
            strategy_name="SYMBOL_REDEFINITION",
            description="Redefines a known symbol",
            trap_mechanism_summary="Exploits prior assumptions",
        )
    ]

    app.dependency_overrides[get_db] = _db_override
    response = client.get("/api/v1/adversarial-strategies/")
    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert len(response.json()) == 1


@patch("app.api.routes.adversarial.get_all_strategies")
def test_list_strategies_returns_empty_list(mock_get_all):
    mock_get_all.return_value = []

    app.dependency_overrides[get_db] = _db_override
    response = client.get("/api/v1/adversarial-strategies/")
    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == []


GENERATE_URL = "/api/v1/questions/1/generate-adversarial"
GENERATE_BODY = {"strategy_id": 2}


def test_generate_adversarial_401_when_no_jwt():
    app.dependency_overrides[get_db] = _db_override
    response = client.post(GENERATE_URL, json=GENERATE_BODY)
    app.dependency_overrides.clear()

    assert response.status_code == 401


@patch("app.api.routes.adversarial.generate_adversarial_question")
def test_generate_adversarial_403_when_not_recruiter(mock_generate):
    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override(
        "CANDIDATE"
    )
    response = client.post(GENERATE_URL, json=GENERATE_BODY)
    app.dependency_overrides.clear()

    assert response.status_code == 403
    mock_generate.assert_not_called()


@patch("app.api.routes.adversarial.generate_adversarial_question")
def test_generate_adversarial_404_when_source_missing(mock_generate):
    mock_generate.side_effect = HTTPException(
        status_code=404, detail="Source question not found"
    )

    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override(
        "RECRUITER"
    )
    response = client.post(GENERATE_URL, json=GENERATE_BODY)
    app.dependency_overrides.clear()

    assert response.status_code == 404


@patch("app.api.routes.adversarial.generate_adversarial_question")
def test_generate_adversarial_201_on_success(mock_generate):
    mock_generate.return_value = MagicMock(
        adv_question_id=5,
        source_question_id=1,
        content="What does f(6) return?",
        strategy_id=2,
        llm="gemini-2.5-flash",
        generated_at=datetime.now(timezone.utc),
        correct_answer="8",
        predicted_wrong_answer="13",
        trap_mechanism="Irrelevant context distracts the model.",
        pattern_used="SYMBOL_REDEFINITION",
        validation_status="draft",
    )

    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override(
        "RECRUITER"
    )
    response = client.post(GENERATE_URL, json=GENERATE_BODY)
    app.dependency_overrides.clear()

    assert response.status_code == 201
    body = response.json()
    assert body["adv_question_id"] == 5
    assert body["source_question_id"] == 1
    assert body["content"] == "What does f(6) return?"
    assert body["strategy_id"] == 2
    assert body["llm"] == "gemini-2.5-flash"
    assert body["correct_answer"] == "8"
    assert body["predicted_wrong_answer"] == "13"
    assert (
        body["trap_mechanism"]
        == "Irrelevant context distracts the model."
    )
    assert body["pattern_used"] == "SYMBOL_REDEFINITION"
    assert body["validation_status"] == "draft"
    mock_generate.assert_called_once()
    call_args = mock_generate.call_args[0]
    assert call_args[1] == 1
    assert call_args[2] == 2


QUESTIONS_URL = "/api/v1/assessments/1/adversarial-questions"


def test_get_adversarial_questions_401_when_no_jwt():
    app.dependency_overrides[get_db] = _db_override
    response = client.get(QUESTIONS_URL)
    app.dependency_overrides.clear()

    assert response.status_code == 401


@patch(
    "app.api.routes.adversarial."
    "get_adversarial_questions_for_assessment"
)
def test_get_adversarial_questions_200_empty_list(mock_get):
    mock_get.return_value = []

    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override(
        "CANDIDATE"
    )
    response = client.get(QUESTIONS_URL)
    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == []


@patch(
    "app.api.routes.adversarial."
    "get_adversarial_questions_for_assessment"
)
def test_get_adversarial_questions_200_with_list(mock_get):
    mock_get.return_value = [
        MagicMock(
            adv_question_id=5,
            source_question_id=1,
            content="What does f(6) return?",
            strategy_id=2,
            llm="gemini-2.5-flash",
            generated_at=datetime.now(timezone.utc),
            correct_answer=None,
            predicted_wrong_answer=None,
            trap_mechanism=None,
            pattern_used=None,
            validation_status="validated",
        )
    ]

    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override(
        "RECRUITER"
    )
    response = client.get(QUESTIONS_URL)
    app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["adv_question_id"] == 5
    assert body[0]["source_question_id"] == 1
    assert body[0]["strategy_id"] == 2


@patch(
    "app.api.routes.adversarial."
    "get_adversarial_questions_for_assessment"
)
def test_get_adversarial_questions_404_when_missing(mock_get):
    mock_get.side_effect = HTTPException(
        status_code=404, detail="Assessment not found"
    )

    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override(
        "CANDIDATE"
    )
    response = client.get(QUESTIONS_URL)
    app.dependency_overrides.clear()

    assert response.status_code == 404


REGENERATE_URL = "/api/v1/adversarial-questions/5/regenerate"
REGENERATE_BODY = {"strategy_id": 2}


def test_regenerate_adversarial_401_when_no_jwt():
    app.dependency_overrides[get_db] = _db_override
    response = client.patch(REGENERATE_URL, json=REGENERATE_BODY)
    app.dependency_overrides.clear()

    assert response.status_code == 401


@patch("app.api.routes.adversarial.regenerate_adversarial_question")
def test_regenerate_adversarial_403_when_not_recruiter(mock_regen):
    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override(
        "CANDIDATE"
    )
    response = client.patch(REGENERATE_URL, json=REGENERATE_BODY)
    app.dependency_overrides.clear()

    assert response.status_code == 403
    mock_regen.assert_not_called()


@patch("app.api.routes.adversarial.regenerate_adversarial_question")
def test_regenerate_adversarial_404_when_not_found(mock_regen):
    mock_regen.side_effect = HTTPException(
        status_code=404, detail="Adversarial question not found"
    )

    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override(
        "RECRUITER"
    )
    response = client.patch(REGENERATE_URL, json=REGENERATE_BODY)
    app.dependency_overrides.clear()

    assert response.status_code == 404


@patch("app.api.routes.adversarial.regenerate_adversarial_question")
def test_regenerate_adversarial_400_when_not_draft(mock_regen):
    mock_regen.side_effect = HTTPException(
        status_code=400,
        detail="Only draft questions can be regenerated",
    )

    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override(
        "RECRUITER"
    )
    response = client.patch(REGENERATE_URL, json=REGENERATE_BODY)
    app.dependency_overrides.clear()

    assert response.status_code == 400


@patch("app.api.routes.adversarial.regenerate_adversarial_question")
def test_regenerate_adversarial_200_on_success(mock_regen):
    mock_regen.return_value = MagicMock(
        adv_question_id=5,
        source_question_id=1,
        content="What does f(7) return?",
        strategy_id=2,
        llm="gemini-3.1-flash-lite",
        generated_at=datetime.now(timezone.utc),
        correct_answer="13",
        predicted_wrong_answer="21",
        trap_mechanism="Irrelevant context distracts the model.",
        pattern_used="SYMBOL_REDEFINITION",
        validation_status="draft",
    )

    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override(
        "RECRUITER"
    )
    response = client.patch(REGENERATE_URL, json=REGENERATE_BODY)
    app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert body["adv_question_id"] == 5
    assert body["source_question_id"] == 1
    assert body["content"] == "What does f(7) return?"
    assert body["strategy_id"] == 2
    assert body["llm"] == "gemini-3.1-flash-lite"
    assert body["correct_answer"] == "13"
    assert body["predicted_wrong_answer"] == "21"
    assert (
        body["trap_mechanism"]
        == "Irrelevant context distracts the model."
    )
    assert body["pattern_used"] == "SYMBOL_REDEFINITION"
    assert body["validation_status"] == "draft"
    mock_regen.assert_called_once()
    call_args = mock_regen.call_args[0]
    assert call_args[1] == 5
    assert call_args[2] == 2


ALL_QUESTIONS_URL = "/api/v1/adversarial-questions"


def test_get_all_adversarial_questions_401_when_no_jwt():
    app.dependency_overrides[get_db] = _db_override
    response = client.get(ALL_QUESTIONS_URL)
    app.dependency_overrides.clear()

    assert response.status_code == 401


VALIDATE_URL = "/api/v1/adversarial-questions/5/validate"


def test_validate_adversarial_401_when_no_jwt():
    app.dependency_overrides[get_db] = _db_override
    response = client.post(VALIDATE_URL)
    app.dependency_overrides.clear()

    assert response.status_code == 401


@patch("app.api.routes.adversarial.validate_adversarial_question")
def test_validate_adversarial_403_when_not_recruiter(mock_validate):
    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override(
        "CANDIDATE"
    )
    response = client.post(VALIDATE_URL)
    app.dependency_overrides.clear()

    assert response.status_code == 403
    mock_validate.assert_not_called()


@patch("app.api.routes.adversarial.validate_adversarial_question")
def test_validate_adversarial_404_when_not_found(mock_validate):
    mock_validate.side_effect = HTTPException(
        status_code=404, detail="Adversarial question not found"
    )

    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override(
        "RECRUITER"
    )
    response = client.post(VALIDATE_URL)
    app.dependency_overrides.clear()

    assert response.status_code == 404


@patch("app.api.routes.adversarial.validate_adversarial_question")
def test_validate_adversarial_400_when_not_draft(mock_validate):
    mock_validate.side_effect = HTTPException(
        status_code=400,
        detail="Only draft questions can be validated",
    )

    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override(
        "RECRUITER"
    )
    response = client.post(VALIDATE_URL)
    app.dependency_overrides.clear()

    assert response.status_code == 400


@patch("app.api.routes.adversarial.validate_adversarial_question")
def test_validate_adversarial_200_on_success(mock_validate):
    mock_validate.return_value = MagicMock(
        adv_question_id=5,
        weaponised_question="What does f(6) return?",
        correct_answer="8",
        predicted_wrong_answer="13",
        gemini_response="The answer is 8.",
        gemini_took_bait=False,
        question_type="MULTIPLE_CHOICE",
        test_case_results=None,
        piston_note=None,
    )

    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override(
        "RECRUITER"
    )
    response = client.post(VALIDATE_URL)
    app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert body["adv_question_id"] == 5
    assert body["weaponised_question"] == "What does f(6) return?"
    assert body["correct_answer"] == "8"
    assert body["predicted_wrong_answer"] == "13"
    assert body["gemini_response"] == "The answer is 8."
    assert body["gemini_took_bait"] is False
    assert body["question_type"] == "MULTIPLE_CHOICE"
    assert body["test_case_results"] is None
    assert body["piston_note"] is None
    mock_validate.assert_called_once()
    call_args = mock_validate.call_args[0]
    assert call_args[1] == 5


SAVE_URL = "/api/v1/adversarial-questions/5/save"


def test_save_adversarial_401_when_no_jwt():
    app.dependency_overrides[get_db] = _db_override
    response = client.post(SAVE_URL)
    app.dependency_overrides.clear()

    assert response.status_code == 401


@patch("app.api.routes.adversarial.save_adversarial_question")
def test_save_adversarial_403_when_not_recruiter(mock_save):
    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override(
        "CANDIDATE"
    )
    response = client.post(SAVE_URL)
    app.dependency_overrides.clear()

    assert response.status_code == 403
    mock_save.assert_not_called()


@patch("app.api.routes.adversarial.save_adversarial_question")
def test_save_adversarial_404_when_not_found(mock_save):
    mock_save.side_effect = HTTPException(
        status_code=404, detail="Adversarial question not found"
    )

    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override(
        "RECRUITER"
    )
    response = client.post(SAVE_URL)
    app.dependency_overrides.clear()

    assert response.status_code == 404


@patch("app.api.routes.adversarial.save_adversarial_question")
def test_save_adversarial_400_when_already_validated(mock_save):
    mock_save.side_effect = HTTPException(
        status_code=400,
        detail="Adversarial question is already validated",
    )

    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override(
        "RECRUITER"
    )
    response = client.post(SAVE_URL)
    app.dependency_overrides.clear()

    assert response.status_code == 400


@patch("app.api.routes.adversarial.save_adversarial_question")
def test_save_adversarial_200_on_success(mock_save):
    mock_save.return_value = MagicMock(
        adv_question_id=5,
        source_question_id=1,
        content="What does f(6) return?",
        strategy_id=2,
        llm="gemini-3.1-flash-lite",
        generated_at=datetime.now(timezone.utc),
        correct_answer="8",
        predicted_wrong_answer="13",
        trap_mechanism="Irrelevant context distracts the model.",
        pattern_used="SYMBOL_REDEFINITION",
        validation_status="validated",
    )

    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override(
        "RECRUITER"
    )
    response = client.post(SAVE_URL)
    app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert body["adv_question_id"] == 5
    assert body["validation_status"] == "validated"
    mock_save.assert_called_once()
    call_args = mock_save.call_args[0]
    assert call_args[1] == 5


@patch("app.api.routes.adversarial.get_all_adversarial_questions")
def test_get_all_adversarial_questions_200_with_list(mock_get):
    mock_get.return_value = [
        MagicMock(
            adv_question_id=5,
            source_question_id=1,
            content="What does f(6) return?",
            strategy_id=2,
            llm="gemini-2.5-flash",
            generated_at=datetime.now(timezone.utc),
            correct_answer=None,
            predicted_wrong_answer=None,
            trap_mechanism=None,
            pattern_used=None,
            validation_status="validated",
        )
    ]

    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override(
        "CANDIDATE"
    )
    response = client.get(ALL_QUESTIONS_URL)
    app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["adv_question_id"] == 5
