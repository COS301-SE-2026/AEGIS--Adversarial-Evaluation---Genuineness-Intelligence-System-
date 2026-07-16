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


GENERATE_URL = "/api/v1/assessments/1/generate-adversarial"
GENERATE_BODY = {"source_question_id": 1, "strategy_id": 2}


def test_generate_adversarial_401_when_no_jwt():
    app.dependency_overrides[get_db] = _db_override
    response = client.post(GENERATE_URL, json=GENERATE_BODY)
    app.dependency_overrides.clear()

    assert response.status_code == 401


@patch("app.api.routes.adversarial.generate_adversarial_question")
@patch("app.api.routes.adversarial.verify_assessment_exists")
def test_generate_adversarial_403_when_not_recruiter(
    mock_verify, mock_generate
):
    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override(
        "CANDIDATE"
    )
    response = client.post(GENERATE_URL, json=GENERATE_BODY)
    app.dependency_overrides.clear()

    assert response.status_code == 403
    mock_verify.assert_not_called()
    mock_generate.assert_not_called()


@patch("app.api.routes.adversarial.generate_adversarial_question")
@patch("app.api.routes.adversarial.verify_assessment_exists")
def test_generate_adversarial_404_when_assessment_missing(
    mock_verify, mock_generate
):
    mock_verify.side_effect = HTTPException(
        status_code=404, detail="Assessment not found"
    )

    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override(
        "RECRUITER"
    )
    response = client.post(GENERATE_URL, json=GENERATE_BODY)
    app.dependency_overrides.clear()

    assert response.status_code == 404
    mock_generate.assert_not_called()


@patch("app.api.routes.adversarial.generate_adversarial_question")
@patch("app.api.routes.adversarial.verify_assessment_exists")
def test_generate_adversarial_201_on_success(mock_verify, mock_generate):
    mock_verify.return_value = MagicMock()
    mock_generate.return_value = MagicMock(
        adv_question_id=5,
        source_question_id=1,
        content="What does f(6) return?",
        strategy_id=2,
        llm="gemini-2.5-flash",
        generated_at=datetime.now(timezone.utc),
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
