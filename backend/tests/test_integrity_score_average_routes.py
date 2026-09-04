from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.core.security import get_current_user
from app.database.database import get_db
from app.main import app
from app.schema.dashboard import IntegrityScoreAverageResponse

ENDPOINT = "/api/v1/reporting/integrity-score-average"


@pytest.fixture
def client_for_role():
    def _build(role):
        app.dependency_overrides[get_db] = lambda: MagicMock()
        app.dependency_overrides[get_current_user] = lambda: {
            "user_id": "7",
            "role": role,
        }
        return TestClient(app)

    yield _build
    app.dependency_overrides.clear()


@pytest.fixture
def recruiter_client(client_for_role):
    return client_for_role("RECRUITER")


@pytest.fixture
def candidate_client(client_for_role):
    return client_for_role("CANDIDATE")


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

    response = recruiter_client.get(ENDPOINT)

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

    response = recruiter_client.get(ENDPOINT)

    assert response.status_code == 200
    assert response.json() == {
        "average_integrity_score": None,
        "scored_candidate_count": 0,
    }


def test_integrity_score_average_returns_403_for_candidate(candidate_client):
    response = candidate_client.get(ENDPOINT)

    assert response.status_code == 403
    assert (
        "Only recruiters can view reporting data."
        in response.json()["detail"]
    )
