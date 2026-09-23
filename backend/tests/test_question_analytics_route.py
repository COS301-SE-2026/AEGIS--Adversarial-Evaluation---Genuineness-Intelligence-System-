from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.core.security import get_current_user
from app.database.database import get_db
from app.main import app
from app.schema.question_analytics import QuestionAnalyticsResponse


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


def make_question_analytics_response():
    return QuestionAnalyticsResponse(
        candidate_assessment_id=123,
        questions=[],
    )


def test_question_analytics_route_returns_200_for_recruiter(
    recruiter_client,
    mock_db,
    monkeypatch,
):
    expected = make_question_analytics_response()
    service_mock = MagicMock(return_value=expected)

    monkeypatch.setattr(
        "app.api.routes.assessment.get_question_analytics",
        service_mock,
    )

    response = recruiter_client.get(
        "/api/v1/candidate-assessments/123/question-analytics",
    )

    assert response.status_code == 200
    assert response.json() == expected.model_dump()
    service_mock.assert_called_once_with(mock_db, 123)


def test_question_analytics_route_returns_403_for_candidate(
    candidate_client,
    monkeypatch,
):
    service_mock = MagicMock()

    monkeypatch.setattr(
        "app.api.routes.assessment.get_question_analytics",
        service_mock,
    )

    response = candidate_client.get(
        "/api/v1/candidate-assessments/123/question-analytics",
    )

    assert response.status_code == 403
    assert response.json()["detail"] == (
        "Only recruiters can access question analytics."
    )
    service_mock.assert_not_called()


def test_question_analytics_route_propagates_404(
    recruiter_client,
    mock_db,
    monkeypatch,
):
    service_mock = MagicMock(
        side_effect=HTTPException(
            status_code=404,
            detail="Assessment session not found",
        ),
    )

    monkeypatch.setattr(
        "app.api.routes.assessment.get_question_analytics",
        service_mock,
    )

    response = recruiter_client.get(
        "/api/v1/candidate-assessments/999/question-analytics",
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Assessment session not found"
    service_mock.assert_called_once_with(mock_db, 999)


def test_question_analytics_route_rejects_non_integer_id(
    recruiter_client,
    monkeypatch,
):
    service_mock = MagicMock()

    monkeypatch.setattr(
        "app.api.routes.assessment.get_question_analytics",
        service_mock,
    )

    response = recruiter_client.get(
        "/api/v1/candidate-assessments/abc/question-analytics",
    )

    assert response.status_code == 422
    assert response.json()["detail"]
    service_mock.assert_not_called()


def test_question_analytics_route_checks_role_before_session_lookup(
    candidate_client,
    monkeypatch,
):
    service_mock = MagicMock(
        side_effect=HTTPException(
            status_code=404,
            detail="Assessment session not found",
        ),
    )

    monkeypatch.setattr(
        "app.api.routes.assessment.get_question_analytics",
        service_mock,
    )

    response = candidate_client.get(
        "/api/v1/candidate-assessments/999/question-analytics",
    )

    assert response.status_code == 403
    assert response.json()["detail"] == (
        "Only recruiters can access question analytics."
    )
    service_mock.assert_not_called()