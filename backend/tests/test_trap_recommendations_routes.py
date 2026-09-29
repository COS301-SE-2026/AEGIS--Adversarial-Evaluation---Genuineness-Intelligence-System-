from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.core.security import get_current_user
from app.database.database import get_db
from app.main import app
from app.schema.trap_recommendations import TrapRecommendationItem

client = TestClient(app)

TRAP_RECOMMENDATIONS_URL = (
    "/api/v1/adversarial-questions/trap-recommendations"
)


def _db_override():
    mock_db = MagicMock()
    yield mock_db


def _auth_override(role: str):
    def get_current_user_mock():
        return {"role": role, "user_id": "1", "sub": "test@tuks.co.za"}
    return get_current_user_mock


def test_trap_recommendations_401_when_no_jwt():
    app.dependency_overrides[get_db] = _db_override
    response = client.get(TRAP_RECOMMENDATIONS_URL)
    app.dependency_overrides.clear()

    assert response.status_code == 401


@patch("app.api.routes.adversarial.get_trap_recommendations")
def test_trap_recommendations_403_for_candidate(mock_get):
    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override("CANDIDATE")
    response = client.get(TRAP_RECOMMENDATIONS_URL)
    app.dependency_overrides.clear()

    assert response.status_code == 403
    mock_get.assert_not_called()


@patch("app.api.routes.adversarial.get_trap_recommendations")
def test_trap_recommendations_200_for_recruiter(mock_get):
    mock_get.return_value = [
        TrapRecommendationItem(
            trap_id=1,
            recommendation_available=True,
            recommendation=(
                "Consider this trap for your next question — 10 "
                "completed attempts with a 60.0% review-signal rate."
            ),
            evidence_status="SUFFICIENT_DATA",
            reason=(
                "Highest review-signal rate among strategies with "
                "sufficient data."
            ),
        ),
        TrapRecommendationItem(
            trap_id=2,
            recommendation_available=False,
            recommendation=None,
            evidence_status="NO_DATA",
            reason=None,
        ),
    ]

    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override("RECRUITER")
    response = client.get(TRAP_RECOMMENDATIONS_URL)
    app.dependency_overrides.clear()

    assert response.status_code == 200
    body = response.json()
    assert len(body["items"]) == 2

    first = body["items"][0]
    assert first["trap_id"] == 1
    assert first["recommendation_available"] is True
    assert "60.0%" in first["recommendation"]
    assert first["evidence_status"] == "SUFFICIENT_DATA"

    second = body["items"][1]
    assert second["trap_id"] == 2
    assert second["recommendation_available"] is False
    assert second["recommendation"] is None
    assert second["reason"] is None
    assert second["evidence_status"] == "NO_DATA"


@patch("app.api.routes.adversarial.get_trap_recommendations")
def test_trap_recommendations_200_empty_list_for_recruiter(mock_get):
    mock_get.return_value = []

    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override("RECRUITER")
    response = client.get(TRAP_RECOMMENDATIONS_URL)
    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == {"items": []}
