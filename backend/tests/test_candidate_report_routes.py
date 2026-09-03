import os
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.core.security import get_current_user
from app.database.database import get_db
from app.main import app
from app.schema.reporting_timeline import (
    BehavioralSummaryResponse,
    MetricsTimelineResponse,
    QuestionTimelineSegment,
    TimelineEvent,
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
def candidate_client(mock_db):
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


def test_behavioral_summary_rejects_non_recruiter(candidate_client):
    response = candidate_client.get(
        "/api/v1/candidate-assessments/12/behavioral-summary"
    )

    assert response.status_code == 403


def test_metrics_timeline_rejects_non_recruiter(candidate_client):
    response = candidate_client.get(
        "/api/v1/candidate-assessments/12/metrics-timeline"
    )

    assert response.status_code == 403


def test_get_behavioral_summary_returns_200(recruiter_client, mock_db):
    response_obj = BehavioralSummaryResponse(
        summary="Candidate typed steadily throughout.",
        generated_at=None,
    )

    with patch(
        "app.api.routes.candidate_report.reporting_timeline"
        ".get_behavioral_summary",
        return_value=response_obj,
    ) as mock_summary:
        response = recruiter_client.get(
            "/api/v1/candidate-assessments/12/behavioral-summary"
        )

    assert response.status_code == 200
    assert response.json() == {
        "summary": "Candidate typed steadily throughout.",
        "generated_at": None,
    }
    mock_summary.assert_called_once_with(mock_db, 12)


def test_get_behavioral_summary_returns_null_when_absent(
    recruiter_client, mock_db,
):
    response_obj = BehavioralSummaryResponse(summary=None, generated_at=None)

    with patch(
        "app.api.routes.candidate_report.reporting_timeline"
        ".get_behavioral_summary",
        return_value=response_obj,
    ):
        response = recruiter_client.get(
            "/api/v1/candidate-assessments/13/behavioral-summary"
        )

    assert response.status_code == 200
    assert response.json() == {"summary": None, "generated_at": None}


def test_get_behavioral_summary_404_when_missing(recruiter_client, mock_db):
    from fastapi import HTTPException

    with patch(
        "app.api.routes.candidate_report.reporting_timeline"
        ".get_behavioral_summary",
        side_effect=HTTPException(
            status_code=404, detail="Candidate assessment not found",
        ),
    ):
        response = recruiter_client.get(
            "/api/v1/candidate-assessments/999/behavioral-summary"
        )

    assert response.status_code == 404


def test_get_behavioral_summary_requires_integer_id(recruiter_client):
    response = recruiter_client.get(
        "/api/v1/candidate-assessments/not-an-id/behavioral-summary"
    )

    assert response.status_code == 422


def test_get_metrics_timeline_returns_200(recruiter_client, mock_db):
    response_obj = MetricsTimelineResponse(
        total_active_time_ms=60000,
        questions=[
            QuestionTimelineSegment(
                question_id=501,
                question_order=1,
                active_time_ms=60000,
                events=[
                    TimelineEvent(
                        event_type="paste",
                        start_offset_ms=0,
                        duration_ms=60000,
                        question_id=501,
                        magnitude=340,
                    ),
                ],
            ),
        ],
    )

    with patch(
        "app.api.routes.candidate_report.reporting_timeline"
        ".get_metrics_timeline",
        return_value=response_obj,
    ) as mock_timeline:
        response = recruiter_client.get(
            "/api/v1/candidate-assessments/12/metrics-timeline"
        )

    assert response.status_code == 200
    assert response.json() == {
        "total_active_time_ms": 60000,
        "questions": [
            {
                "question_id": 501,
                "question_order": 1,
                "active_time_ms": 60000,
                "events": [
                    {
                        "event_type": "paste",
                        "start_offset_ms": 0,
                        "duration_ms": 60000,
                        "question_id": 501,
                        "magnitude": 340,
                    },
                ],
            },
        ],
    }
    mock_timeline.assert_called_once_with(mock_db, 12)


def test_get_metrics_timeline_404_when_missing(recruiter_client, mock_db):
    from fastapi import HTTPException

    with patch(
        "app.api.routes.candidate_report.reporting_timeline"
        ".get_metrics_timeline",
        side_effect=HTTPException(
            status_code=404, detail="Candidate assessment not found",
        ),
    ):
        response = recruiter_client.get(
            "/api/v1/candidate-assessments/999/metrics-timeline"
        )

    assert response.status_code == 404


def test_get_metrics_timeline_requires_integer_id(recruiter_client):
    response = recruiter_client.get(
        "/api/v1/candidate-assessments/not-an-id/metrics-timeline"
    )

    assert response.status_code == 422
