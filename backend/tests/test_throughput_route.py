from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.core.security import get_current_user
from app.database.database import get_db
from app.main import app
from app.schema.dashboard import ThroughputResponse


@pytest.fixture
def mock_db():
    return MagicMock()


@pytest.fixture
def recruiter_client(mock_db):
    def override_get_db():
        return mock_db

    def override_get_current_user():
        return {"user_id": "7", "role": "RECRUITER"}

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def candidate_client(mock_db):
    def override_get_db():
        return mock_db

    def override_get_current_user():
        return {"user_id": "7", "role": "CANDIDATE"}

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def unauthenticated_client(mock_db):
    def override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = override_get_db

    yield TestClient(app)
    app.dependency_overrides.clear()


def test_throughput_route_returns_200_for_recruiter(recruiter_client, mock_db):
    response_obj = ThroughputResponse(
        total_assessments=6,
        active_count=2,
        completed_count=3,
        expired_count=1,
        avg_time_to_completion_seconds=1800.5,
        avg_score=84.25,
        completion_rate=0.75,
    )
    with patch(
        "app.api.routes.reporting.get_throughput",
        return_value=response_obj,
    ) as mock_service:
        response = recruiter_client.get("/api/v1/reporting/throughput")
    assert response.status_code == 200
    assert response.json() == {
        "total_assessments": 6,
        "active_count": 2,
        "completed_count": 3,
        "expired_count": 1,
        "avg_time_to_completion_seconds": 1800.5,
        "avg_score": 84.25,
        "completion_rate": 0.75,
    }
    mock_service.assert_called_once_with(mock_db)


def test_throughput_route_rejects_candidate(candidate_client):
    response = candidate_client.get("/api/v1/reporting/throughput")
    assert response.status_code == 403
    assert "Only recruiters can view reporting data." in response.json()["detail"]


def test_throughput_route_rejects_unauthenticated(unauthenticated_client):
    response = unauthenticated_client.get("/api/v1/reporting/throughput")
    assert response.status_code == 401