from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient

from app.core.security import get_current_user
from app.database.database import get_db
from app.main import app
from app.schema.metrics_radar import MetricsRadarResponse, RadarAxis
from app.schema.review_priority import ReviewPriorityResponse


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


def test_review_priority_route_returns_200_for_recruiter(recruiter_client, monkeypatch):
    expected = ReviewPriorityResponse(
        score=0,
        band="low",
        contributing_factors=[],
    )

    monkeypatch.setattr(
        "app.api.routes.assessment.get_review_priority",
        lambda *args, **kwargs: expected,
    )

    response = recruiter_client.get(
        "/api/v1/candidate-assessments/123/review-priority"
    )

    assert response.status_code == 200
    assert response.json() == {
        "score": 0,
        "band": "low",
        "contributing_factors": [],
        "notable_question": None,
    }


def test_review_priority_route_returns_403_for_candidate(candidate_client):
    response = candidate_client.get(
        "/api/v1/candidate-assessments/123/review-priority"
    )

    assert response.status_code == 403
    assert "Only recruiters can access review priority." in response.json()["detail"]


def test_metrics_radar_route_returns_200_for_recruiter(recruiter_client, monkeypatch):
    expected = MetricsRadarResponse(
        axes=[
            RadarAxis(axis="paste_ratio", candidate_value=0.4, cohort_avg_value=0.2),
            RadarAxis(axis="backspace_rate", candidate_value=0.1, cohort_avg_value=0.15),
            RadarAxis(axis="typing_speed", candidate_value=0.6, cohort_avg_value=0.5),
            RadarAxis(axis="focus_loss_rate", candidate_value=0.05, cohort_avg_value=0.1),
        ],
        cohort_sample_size=5,
        insufficient_cohort_data=False,
    )

    monkeypatch.setattr(
        "app.api.routes.assessment.get_metrics_radar",
        lambda *args, **kwargs: expected,
    )

    response = recruiter_client.get(
        "/api/v1/candidate-assessments/123/metrics-radar"
    )

    assert response.status_code == 200
    body = response.json()
    assert body["cohort_sample_size"] == 5
    assert body["insufficient_cohort_data"] is False
    assert len(body["axes"]) == 4


def test_metrics_radar_route_returns_403_for_candidate(candidate_client):
    response = candidate_client.get(
        "/api/v1/candidate-assessments/123/metrics-radar"
    )

    assert response.status_code == 403
    assert "Only recruiters can access candidate metrics radar." in response.json()["detail"]