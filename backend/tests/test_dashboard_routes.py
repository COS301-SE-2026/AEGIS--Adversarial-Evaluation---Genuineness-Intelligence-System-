import os
import pytest
from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient
from app.main import app
from app.database.database import get_db
from app.schema.dashboard import (
    DashboardSummaryResponse,
    TopPerformer,
    AIUsageRate,
    AIUsageLevel,
    TableItem,
    DashboardTableResponse,
)

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("SECRET_KEY", "test-secret-key")

@pytest.fixture
def mock_db():
    return MagicMock()

@pytest.fixture
def client(mock_db):
    def override_get_db():
        return mock_db

    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()

def test_get_dashboard_summary_returns_200(client, mock_db):
    response_obj = DashboardSummaryResponse(
        top_performers=[TopPerformer(candidate_name="Alice", score_percent=95.0)],
        total_assessments=5,
        ai_usage_rate=AIUsageRate(level=AIUsageLevel.MEDIUM, percent=40.0),
    )

    with patch(
        "app.api.routes.dashboard.dashboard.get_dashboard_summary",
        return_value=response_obj,
    ) as mock_summary:
        response = client.get(
            "/api/v1/admin/dashboard/summary",
            params={"recruiter_id": 7},
        )

    assert response.status_code == 200
    assert response.json() == {
        "top_performers": [{"candidate_name": "Alice", "score_percent": 95.0}],
        "total_assessments": 5,
        "ai_usage_rate": {"level": "MEDIUM", "percent": 40.0},
    }
    mock_summary.assert_called_once_with(mock_db, 7)

def test_get_dashboard_summary_requires_recruiter_id(client):
    response = client.get("/api/v1/admin/dashboard/summary")
    assert response.status_code == 422


def test_get_assessments_summary_returns_200(client, mock_db):
    response_obj = DashboardTableResponse(
        items=[
            TableItem(
                assessment_id=101,
                name="Python Assessment",
                average_score_percent=88.5,
                top_candidate_name="Alice",
            )
        ],
        page=1,
        page_size=8,
    )

    with patch(
        "app.api.routes.dashboard.dashboard.get_assessment_summary",
        return_value=response_obj,
    ) as mock_summary:
        response = client.get(
            "/api/v1/admin/dashboard/assessments",
            params={"recruiter_id": 7, "page": 1, "page_size": 8},
        )

    assert response.status_code == 200
    assert response.json() == {
        "items": [
            {
                "assessment_id": 101,
                "name": "Python Assessment",
                "average_score_percent": 88.5,
                "top_candidate_name": "Alice",
            }
        ],
        "page": 1,
        "page_size": 8,
    }
    mock_summary.assert_called_once_with(7, mock_db, 1, 8)


def test_get_assessments_summary_defaults_page_and_size(client):
    response = client.get(
        "/api/v1/admin/dashboard/assessments",
        params={"recruiter_id": 7},
    )

    assert response.status_code == 200