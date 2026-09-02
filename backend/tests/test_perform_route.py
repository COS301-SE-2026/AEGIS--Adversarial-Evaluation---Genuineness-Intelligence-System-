from unittest.mock import MagicMock, patch
import pytest
from fastapi.testclient import TestClient
from app.core.security import get_current_user
from app.database.database import get_db
from app.main import app
from app.schema.dashboard import BreakdownSlice, PerformanceBreakdownResponse


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


@pytest.mark.parametrize(
    "by,label",
    [
        ("category", "Algorithms"),
        ("difficulty", "Easy"),
    ],
)
def test_performance_breakdown_route_returns_200_for_recruiter(
    recruiter_client,
    mock_db,
    by,
    label,
):
    response_obj = PerformanceBreakdownResponse(
        by=by,
        slices=[
            BreakdownSlice(
                label=label,
                avg_success_rate=0.75,
                attempt_count=12,
            )
        ],
    )

    with patch(
        "app.api.routes.reporting.get_performance_breakdown",
        return_value=response_obj,
    ) as mock_service:
        response = recruiter_client.get(
            "/api/v1/reporting/performance-breakdown",
            params={"by": by},
        )
    assert response.status_code == 200
    assert response.json() == {
        "by": by,
        "slices": [
            {
                "label": label,
                "avg_success_rate": 0.75,
                "attempt_count": 12,
            }
        ],
    }
    mock_service.assert_called_once_with(mock_db, by=by)


def test_performance_breakdown_route_rejects_candidate(
    candidate_client,
):
    response = candidate_client.get(
        "/api/v1/reporting/performance-breakdown",
        params={"by": "category"},
    )
    assert response.status_code == 403
    assert "Only recruiters can view reporting data." in response.json()["detail"]


def test_performance_breakdown_route_rejects_unauthenticated(
    unauthenticated_client,
):
    response = unauthenticated_client.get(
        "/api/v1/reporting/performance-breakdown",
        params={"by": "category"},
    )
    assert response.status_code == 401


def test_performance_breakdown_route_rejects_invalid_by_value(
    recruiter_client,
):
    response = recruiter_client.get(
        "/api/v1/reporting/performance-breakdown",
        params={"by": "adversarial"},
    )
    assert response.status_code == 422