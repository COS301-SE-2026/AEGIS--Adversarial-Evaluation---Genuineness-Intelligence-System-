import os
import pytest
from unittest.mock import MagicMock, patch
from fastapi.testclient import TestClient
from app.main import app
from app.database.database import get_db
from app.core.security import get_current_user
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
    DashboardGraphResponse,
    AverageScore,
    QuestionQualityResponse,
    QuestionQualityBucket,
    ThroughputResponse
)

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("SECRET_KEY", "test-secret-key")

DASHBOARD_ENDPOINTS = [
    "/api/v1/admin/dashboard/summary",
    "/api/v1/admin/dashboard/score-distribution",
    "/api/v1/admin/dashboard/assessments",
    "/api/v1/admin/dashboard/assessments/101",
    "/api/v1/admin/dashboard/assessments/101/candidates",
    
]

REPORTING_ENDPOINTS = [
    "/api/v1/reporting/question-quality",
    "/api/v1/reporting/throughput"
]


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


#all the dashboard routes require role to be Recruiter
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
            "user_id": "7",
            "role": "CANDIDATE",
        }

    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = (
        override_get_current_user
    )

    yield TestClient(app)

    app.dependency_overrides.clear()


@pytest.mark.parametrize("path", DASHBOARD_ENDPOINTS)
def test_dashboard_endpoints_reject_non_recruiter(candidate_client, path):
    response = candidate_client.get(path)
    assert response.status_code == 403
    assert "Only recruiters" in response.json()["detail"]


@pytest.mark.parametrize("path", DASHBOARD_ENDPOINTS)
def test_dashboard_endpoints_reject_unauthenticated(client, path):
    response = client.get(path)
    assert response.status_code == 401


def test_get_dashboard_summary_returns_200(recruiter_client, mock_db):
    response_obj = DashboardSummaryResponse(
        top_performers=[TopPerformer(candidate_name="Alice", score_percent=95.0)],
        total_assessments=5,
        ai_usage_rate=AIUsageRate(level=AIUsageLevel.MEDIUM, percent=40.0),
    )

    with patch(
        "app.api.routes.dashboard.dashboard.get_dashboard_summary",
        return_value=response_obj,
    ) as mock_summary:
        response = recruiter_client.get(
            "/api/v1/admin/dashboard/summary",
        )

    assert response.status_code == 200
    assert response.json() == {
        "top_performers": [{"candidate_name": "Alice", "score_percent": 95.0}],
        "total_assessments": 5,
        "ai_usage_rate": {"level": "MEDIUM", "percent": 40.0},
    }
    # recruiter_id is derived from the authenticated user (user_id=7),
    # not trusted from a query param
    mock_summary.assert_called_once_with(mock_db, 7)


def test_get_score_distribution_returns_200(recruiter_client, mock_db):
    response_obj = DashboardGraphResponse(
        bars=[
            AverageScore(
                assessment_name="Python Assessment", average_score=88.5
            ),
        ]
    )

    with patch(
        "app.api.routes.dashboard.dashboard.get_graph_values",
        return_value=response_obj,
    ) as mock_graph:
        response = recruiter_client.get(
            "/api/v1/admin/dashboard/score-distribution",
        )

    assert response.status_code == 200
    assert response.json() == {
        "bars": [
            {"assessment_name": "Python Assessment", "average_score": 88.5},
        ],
    }
    mock_graph.assert_called_once_with(mock_db, 7)


def test_get_assessments_summary_returns_200(recruiter_client, mock_db):
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
        response = recruiter_client.get(
            "/api/v1/admin/dashboard/assessments",
            params={"page": 1, "page_size": 8},
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


def test_get_assessments_summary_defaults_page_and_size(
    recruiter_client, mock_db
):
    response_obj = DashboardTableResponse(items=[], page=1, page_size=8)

    with patch(
        "app.api.routes.dashboard.dashboard.get_assessment_summary",
        return_value=response_obj,
    ):
        response = recruiter_client.get(
            "/api/v1/admin/dashboard/assessments",
        )

    assert response.status_code == 200


def test_get_assessment_detail_cards_returns_200(recruiter_client, mock_db):
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
        response = recruiter_client.get(
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


def test_get_assessment_detail_cards_with_no_performers(
    recruiter_client, mock_db
):
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
        response = recruiter_client.get(
            "/api/v1/admin/dashboard/assessments/102"
        )

    assert response.status_code == 200
    data = response.json()
    assert data["assessment_id"] == 102
    assert data["assessment_name"] == "New Assessment"
    assert data["top_performers"] == []
    assert data["average_total_percent"] == 0.0
    assert data["average_completion_time"] == 0.0
    assert data["ai_usage"]["level"] == "LOW"


def test_get_assessment_detail_cards_medium_ai_usage(
    recruiter_client, mock_db
):
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
        response = recruiter_client.get(
            "/api/v1/admin/dashboard/assessments/103"
        )

    assert response.status_code == 200
    data = response.json()
    assert data["ai_usage"]["level"] == "MEDIUM"
    assert data["ai_usage"]["percent"] == 50.0


def test_get_assessment_detail_cards_invalid_id_type(recruiter_client):
    response = recruiter_client.get(
        "/api/v1/admin/dashboard/assessments/invalid"
    )
    assert response.status_code == 422


def test_get_assessment_detail_cards_three_top_performers(
    recruiter_client, mock_db
):
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
        response = recruiter_client.get(
            "/api/v1/admin/dashboard/assessments/104"
        )

    assert response.status_code == 200
    data = response.json()
    assert len(data["top_performers"]) == 3
    assert data["top_performers"][0]["candidate_name"] == "Alice"
    assert data["top_performers"][1]["candidate_name"] == "Bob"
    assert data["top_performers"][2]["candidate_name"] == "Charlie"


def test_get_assessment_detail_table_returns_filtered_rows(
    recruiter_client, mock_db
):
    response_obj = AssessmentDetailTableResponse(
        items=[
            FilterableTableItem(
                candidate_assess_id=501,
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
        response = recruiter_client.get(
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
                "candidate_assess_id": 501,
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

def test_get_assessment_detail_table_returns_empty_items(
    recruiter_client, mock_db
):
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
        response = recruiter_client.get(
            "/api/v1/admin/dashboard/assessments/101/candidates"
        )

    assert response.status_code == 200
    assert response.json() == {
        "items": [],
        "page": 1,
        "page_size": 8,
    }


@pytest.mark.parametrize("path", REPORTING_ENDPOINTS)
def test_reporting_endpoints_reject_non_recruiter(candidate_client, path):
    response = candidate_client.get(path)
    assert response.status_code == 403
    assert "Only recruiters" in response.json()["detail"]


@pytest.mark.parametrize("path", REPORTING_ENDPOINTS)
def test_reporting_endpoints_reject_unauthenticated(client, path):
    response = client.get(path)
    assert response.status_code == 401

def test_get_question_quality_returns_200(recruiter_client, mock_db):
    response_obj = QuestionQualityResponse(
        total_questions_answered=4,
        buckets=[
            QuestionQualityBucket(
                bucket="needs_revision",
                count=1,
                question_ids=[104]
            ),
            QuestionQualityBucket(
                bucket="balanced",
                count=1,
                question_ids=[102]
            ),
            QuestionQualityBucket(
                bucket="too_easy",
                count=1,
                question_ids=[103]
            ),
            QuestionQualityBucket(
                bucket="thin_sample",
                count=1,
                question_ids=[101]
            ),
        ],
        guidance=[
            "1 question has fallen below 30% success and should be reviewed.",
            "1 question is in the balanced range and appear healthy.",
            "1 question are performing above 95% success and may be too easy.",
            "1 question has fewer than 3 attempts and need more data before judging quality.",
        ],
    )
    with patch(
        "app.api.routes.reporting.get_question_quality",
        return_value=response_obj,
    ) as mock_quality:
        response = recruiter_client.get("/api/v1/reporting/question-quality")

    assert response.status_code == 200
    assert response.json() == {
        "total_questions_answered": 4,
        "buckets": [
            {
                "bucket": "needs_revision",
                "count": 1,
                "question_ids": [104]
            },
            {
                "bucket": "balanced",
                "count": 1,
                "question_ids": [102]
            },
            {
                "bucket": "too_easy",
                "count": 1,
                "question_ids": [103]
            },
            {
                "bucket": "thin_sample",
                "count": 1,
                "question_ids": [101]
            },
        ],
        "guidance": [
            "1 question has fallen below 30% success and should be reviewed.",
            "1 question is in the balanced range and appear healthy.",
            "1 question are performing above 95% success and may be too easy.",
            "1 question has fewer than 3 attempts and need more data before judging quality.",
        ],
    }
    mock_quality.assert_called_once_with(mock_db)


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

