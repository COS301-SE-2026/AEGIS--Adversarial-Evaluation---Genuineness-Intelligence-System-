from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.core.security import get_current_user
from app.database.database import get_db
from app.main import app
from app.schema.dashboard import IntegrityScoreAverageResponse


@pytest.fixture
def mock_db():
    return MagicMock()


@pytest.fixture
def recruiter_client(mock_db):
    def override_get_db():
        return mock_db

    def override_get_current_user():
        return {
            "user_id": "7",
            "role": "RECRUITER",
        }

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def candidate_client(mock_db):
    def override_get_db():
        return mock_db

    def override_get_current_user():
        return {
            "user_id": "7",
            "role": "CANDIDATE",
        }

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    yield TestClient(app)
    app.dependency_overrides.clear()


def test_integrity_score_average_returns_200_for_recruiter(
    recruiter_client, monkeypatch
):
    expected = IntegrityScoreAverageResponse(
        average_integrity_score=64,
        scored_candidate_count=9,
    )

    monkeypatch.setattr(
        "app.api.routes.reporting.get_integrity_score_average",
        lambda *args, **kwargs: expected,
    )

    response = recruiter_client.get(
        "/api/v1/reporting/integrity-score-average"
    )

    assert response.status_code == 200
    assert response.json() == {
        "average_integrity_score": 64,
        "scored_candidate_count": 9,
    }


def test_integrity_score_average_returns_null_when_no_scores(
    recruiter_client, monkeypatch
):
    expected = IntegrityScoreAverageResponse(
        average_integrity_score=None,
        scored_candidate_count=0,
    )

    monkeypatch.setattr(
        "app.api.routes.reporting.get_integrity_score_average",
        lambda *args, **kwargs: expected,
    )

    response = recruiter_client.get(
        "/api/v1/reporting/integrity-score-average"
    )

    assert response.status_code == 200
    assert response.json() == {
        "average_integrity_score": None,
        "scored_candidate_count": 0,
    }


def test_integrity_score_average_returns_403_for_candidate(candidate_client):
    response = candidate_client.get(
        "/api/v1/reporting/integrity-score-average"
    )

    assert response.status_code == 403
    assert (
        "Only recruiters can view reporting data."
        in response.json()["detail"]
    )
