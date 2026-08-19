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
    AssessmentDetailCardResponse,
    AssessmentDetailTableResponse,
    FilterableTableItem,
    CandidateResultStatus,
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


def test_get_assessment_detail_cards_returns_200(client, mock_db):
    from app.schema.dashboard import AssessmentDetailCardResponse

    response_obj = AssessmentDetailCardResponse(
        assessment_id=101,
        assessment_name="Python Assessment",
        top_performers=[
            TopPerformer(candidate_name="Alice", score_percent=95.0),
            TopPerformer(candidate_name="Bob", score_percent=87.5),
        ],
        average_total_percent=85.83,
        average_completion_time=1800.5,
        ai_usage=AIUsageRate(level=AIUsageLevel.HIGH, percent=70.0),
    )

    with patch(
        "app.api.routes.dashboard.dashboard.get_assessment_detail_cards",
        return_value=response_obj,
    ) as mock_detail:
        response = client.get(
            "/api/v1/admin/dashboard/assessments/101"
        )

    assert response.status_code == 200
    assert response.json() == {
        "assessment_id": 101,
        "assessment_name": "Python Assessment",
        "top_performers": [
            {"candidate_name": "Alice", "score_percent": 95.0},
            {"candidate_name": "Bob", "score_percent": 87.5},
        ],
        "average_total_percent": 85.83,
        "average_completion_time": 1800.5,
        "ai_usage": {"level": "HIGH", "percent": 70.0},
    }
    mock_detail.assert_called_once_with(101, mock_db)


def test_get_assessment_detail_cards_with_no_performers(client, mock_db):
    from app.schema.dashboard import AssessmentDetailCardResponse

    response_obj = AssessmentDetailCardResponse(
        assessment_id=102,
        assessment_name="New Assessment",
        top_performers=[],
        average_total_percent=0.0,
        average_completion_time=0.0,
        ai_usage=AIUsageRate(level=AIUsageLevel.LOW, percent=0.0),
    )

    with patch(
        "app.api.routes.dashboard.dashboard.get_assessment_detail_cards",
        return_value=response_obj,
    ):
        response = client.get("/api/v1/admin/dashboard/assessments/102")

    assert response.status_code == 200
    data = response.json()
    assert data["assessment_id"] == 102
    assert data["assessment_name"] == "New Assessment"
    assert data["top_performers"] == []
    assert data["average_total_percent"] == 0.0
    assert data["average_completion_time"] == 0.0
    assert data["ai_usage"]["level"] == "LOW"


def test_get_assessment_detail_cards_medium_ai_usage(client, mock_db):
    from app.schema.dashboard import AssessmentDetailCardResponse

    response_obj = AssessmentDetailCardResponse(
        assessment_id=103,
        assessment_name="JavaScript Assessment",
        top_performers=[
            TopPerformer(candidate_name="Charlie", score_percent=82.5),
        ],
        average_total_percent=75.0,
        average_completion_time=2100.0,
        ai_usage=AIUsageRate(level=AIUsageLevel.MEDIUM, percent=50.0),
    )

    with patch(
        "app.api.routes.dashboard.dashboard.get_assessment_detail_cards",
        return_value=response_obj,
    ):
        response = client.get("/api/v1/admin/dashboard/assessments/103")

    assert response.status_code == 200
    data = response.json()
    assert data["ai_usage"]["level"] == "MEDIUM"
    assert data["ai_usage"]["percent"] == 50.0


def test_get_assessment_detail_cards_invalid_id_type(client):
    response = client.get("/api/v1/admin/dashboard/assessments/invalid")
    assert response.status_code == 422


def test_get_assessment_detail_cards_three_top_performers(client, mock_db):
    from app.schema.dashboard import AssessmentDetailCardResponse

    response_obj = AssessmentDetailCardResponse(
        assessment_id=104,
        assessment_name="SQL Assessment",
        top_performers=[
            TopPerformer(candidate_name="Alice", score_percent=98.5),
            TopPerformer(candidate_name="Bob", score_percent=92.0),
            TopPerformer(candidate_name="Charlie", score_percent=88.5),
        ],
        average_total_percent=86.33,
        average_completion_time=1500.0,
        ai_usage=AIUsageRate(level=AIUsageLevel.HIGH, percent=72.5),
    )

    with patch(
        "app.api.routes.dashboard.dashboard.get_assessment_detail_cards",
        return_value=response_obj,
    ):
        response = client.get("/api/v1/admin/dashboard/assessments/104")

    assert response.status_code == 200
    data = response.json()
    assert len(data["top_performers"]) == 3
    assert data["top_performers"][0]["candidate_name"] == "Alice"
    assert data["top_performers"][1]["candidate_name"] == "Bob"
    assert data["top_performers"][2]["candidate_name"] == "Charlie"


def test_get_assessment_detail_table_returns_filtered_rows(client, mock_db):
    response_obj = AssessmentDetailTableResponse(
        items=[
            FilterableTableItem(
                candidate_id=12,
                candidate_name="Alice",
                total_score_percent=87.46,
                status=CandidateResultStatus.PASS,
                ai_rating_percent=91.23,
            )
        ],
        page=1,
        page_size=8,
    )

    with patch(
        "app.api.routes.dashboard.dashboard"
        ".get_assessment_detail_table_info",
        return_value=response_obj,
    ) as mock_table:
        response = client.get(
            "/api/v1/admin/dashboard/assessments/101/candidates",
            params={
                "status": "PASS",
                "search": "Alice",
                "page": 1,
                "page_size": 8,
            },
        )

    assert response.status_code == 200
    assert response.json() == {
        "items": [
            {
                "candidate_id": 12,
                "candidate_name": "Alice",
                "total_score_percent": 87.46,
                "status": "PASS",
                "ai_rating_percent": 91.23,
            }
        ],
        "page": 1,
        "page_size": 8,
    }

    mock_table.assert_called_once_with(
        mock_db,
        101,
        "PASS",
        "Alice",
        1,
        8,
    )

def test_get_assessment_detail_table_returns_empty_items(client, mock_db):
    response_obj = AssessmentDetailTableResponse(
        items=[],
        page=1,
        page_size=8,
    )

    with patch(
        "app.api.routes.dashboard.dashboard"
        ".get_assessment_detail_table_info",
        return_value=response_obj,
    ):
        response = client.get(
            "/api/v1/admin/dashboard/assessments/101/candidates"
        )

    assert response.status_code == 200
    assert response.json() == {
        "items": [],
        "page": 1,
        "page_size": 8,
    }

