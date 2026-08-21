import os
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.core.security import get_current_user
from app.database.database import get_db
from app.main import app
from app.schema.candidate_response_metrics import (
    CandidateResponseMetricsResponse,
)


os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("SECRET_KEY", "test-secret-key")


@pytest.fixture
def mock_db():
    return MagicMock()


@pytest.fixture
def recruiter_client(mock_db):
    def override_get_db():
        return mock_db

    def override_get_current_user():
        return {
            "user_id": "5",
            "role": "RECRUITER",
        }

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = (
        override_get_current_user
    )

    yield TestClient(app)

    app.dependency_overrides.clear()


@pytest.fixture
def candidate_metrics_client(mock_db):
    def override_get_db():
        return mock_db

    def override_get_current_user():
        return {
            "user_id": "5",
            "role": "CANDIDATE",
        }

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = (
        override_get_current_user
    )

    yield TestClient(app)

    app.dependency_overrides.clear()


def test_metrics_rejects_non_recruiter(candidate_metrics_client):
    response = candidate_metrics_client.get(
        "/api/v1/candidate-responses/7/metrics"
    )

    assert response.status_code == 403


def test_get_response_metrics_returns_200(recruiter_client, mock_db):
    response_obj = CandidateResponseMetricsResponse(
        candidate_response_id=7,
        active_time_ms=100000,
        unique_keys_count=27,
        chars_alnum=41,
        chars_special=44,
        backspace_count=33,
        copy_event_count=12,
        copy_char_count=88,
        paste_event_count=24,
        paste_char_count=344,
        focus_loss_count=2,
        focus_loss_time_ms=2899,
    )

    with patch(
        "app.api.routes.metrics.metrics.get_metrics_for_response",
        return_value=response_obj,
    ) as mock_metrics:
        response = recruiter_client.get(
            "/api/v1/candidate-responses/7/metrics"
        )

    assert response.status_code == 200
    assert response.json() == response_obj.model_dump()
    assert response.json()["copy_char_count"] == 88
    mock_metrics.assert_called_once_with(mock_db, 7)


def test_get_response_metrics_requires_integer_id(recruiter_client):
    response = recruiter_client.get(
        "/api/v1/candidate-responses/not-an-id/metrics"
    )

    assert response.status_code == 422


def test_get_assessment_metrics_returns_200(recruiter_client, mock_db):
    response_obj = [
        CandidateResponseMetricsResponse(
            candidate_response_id=1,
            active_time_ms=184300,
            unique_keys_count=27,
            chars_alnum=200,
            chars_special=44,
            backspace_count=38,
            copy_event_count=1,
            copy_char_count=12,
            paste_event_count=2,
            paste_char_count=340,
            focus_loss_count=1,
            focus_loss_time_ms=8000,
        ),
        CandidateResponseMetricsResponse(
            candidate_response_id=2,
            active_time_ms=210500,
            unique_keys_count=35,
            chars_alnum=600,
            chars_special=20,
            backspace_count=45,
            copy_event_count=0,
            copy_char_count=0,
            paste_event_count=0,
            paste_char_count=0,
            focus_loss_count=4,
            focus_loss_time_ms=15000,
        ),
    ]

    with patch(
        "app.api.routes.metrics.metrics.get_metrics_for_assessment",
        return_value=response_obj,
    ) as mock_metrics:
        response = recruiter_client.get(
            "/api/v1/candidate-assessments/7/metrics"
        )

    assert response.status_code == 200
    assert response.json() == [
        item.model_dump() for item in response_obj
    ]
    assert response.json()[0]["copy_char_count"] == 12
    mock_metrics.assert_called_once_with(mock_db, 7)


def test_get_assessment_metrics_requires_integer_id(recruiter_client):
    response = recruiter_client.get(
        "/api/v1/candidate-assessments/not-an-id/metrics"
    )

    assert response.status_code == 422