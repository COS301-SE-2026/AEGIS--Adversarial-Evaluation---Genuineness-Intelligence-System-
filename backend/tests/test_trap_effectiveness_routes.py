from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.core.security import get_current_user
from app.database.database import get_db
from app.main import app
from app.schema.trap_effectiveness import TrapEffectivenessItem

client = TestClient(app)

TRAP_EFFECTIVENESS_URL = "/api/v1/adversarial-questions/trap-effectiveness"


def _db_override():
    mock_db = MagicMock()
    yield mock_db


def _auth_override(role: str):
    def get_current_user_mock():
        return {"role": role, "user_id": "1", "sub": "test@tuks.co.za"}
    return get_current_user_mock


def test_trap_effectiveness_401_when_no_jwt():
    app.dependency_overrides[get_db] = _db_override
    response = client.get(TRAP_EFFECTIVENESS_URL)
    app.dependency_overrides.clear()

    assert response.status_code == 401


@patch("app.api.routes.adversarial.get_trap_effectiveness")
def test_trap_effectiveness_403_for_candidate(mock_get):
    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override("CANDIDATE")
    response = client.get(TRAP_EFFECTIVENESS_URL)
    app.dependency_overrides.clear()

    assert response.status_code == 403
    mock_get.assert_not_called()


@patch("app.api.routes.adversarial.get_trap_effectiveness")
def test_trap_effectiveness_200_for_recruiter(mock_get):
    mock_get.return_value = [
        TrapEffectivenessItem(
            trap_id=1,
            trap_name="IRRELEVANT_CONTEXT",
            generated_question_count=5,
            completed_attempt_count=10,
            elevated_review_count=4,
            review_signal_rate=40.0,
            evidence_status="SUFFICIENT_DATA",
        )
    ]

    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override("RECRUITER")
    response = client.get(TRAP_EFFECTIVENESS_URL)
    app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert len(body["items"]) == 1
    item = body["items"][0]
    assert item["trap_id"] == 1
    assert item["trap_name"] == "IRRELEVANT_CONTEXT"
    assert item["generated_question_count"] == 5
    assert item["completed_attempt_count"] == 10
    assert item["elevated_review_count"] == 4
    assert item["review_signal_rate"] == 40.0
    assert item["evidence_status"] == "SUFFICIENT_DATA"


@patch("app.api.routes.adversarial.get_trap_effectiveness")
def test_trap_effectiveness_200_empty_list_for_recruiter(mock_get):
    mock_get.return_value = []

    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override("RECRUITER")
    response = client.get(TRAP_EFFECTIVENESS_URL)
    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {"items": []}


@patch("app.api.routes.adversarial.get_trap_effectiveness")
def test_trap_effectiveness_null_rate_serializes_as_null(mock_get):
    mock_get.return_value = [
        TrapEffectivenessItem(
            trap_id=2,
            trap_name="NEGATION_INJECTION",
            generated_question_count=3,
            completed_attempt_count=0,
            elevated_review_count=0,
            review_signal_rate=None,
            evidence_status="NO_DATA",
        )
    ]

    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override("RECRUITER")
    response = client.get(TRAP_EFFECTIVENESS_URL)
    app.dependency_overrides.clear()

    assert response.status_code == 200
    item = response.json()["items"][0]
    assert item["review_signal_rate"] is None
    assert item["evidence_status"] == "NO_DATA"
