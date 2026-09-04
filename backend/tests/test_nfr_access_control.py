import os
from unittest.mock import MagicMock
import pytest
from fastapi.testclient import TestClient
from app.core.security import get_current_user
from app.database.database import get_db
from app.main import app
from app.models.candidate_assessment import SessionStatus

ENV_DEFAULTS = {
    "DATABASE_URL": "postgresql://test:test@localhost/test",
    "SECRET_KEY": "test-secret-key",
    "GOOGLE_CLIENT_ID": "test-client-id",
    "GOOGLE_CLIENT_SECRET": "test-client-secret",
    "GOOGLE_REDIRECT_URI": "http://localhost:8000/callback",
    "GITHUB_CLIENT_ID": "test-github-client-id",
    "GITHUB_CLIENT_SECRET": "test-github-client-secret",
    "GITHUB_REDIRECT_URI": "http://localhost:8000/github/callback",
}

for key, value in ENV_DEFAULTS.items():
    os.environ.setdefault(key, value)

OWNER_UID = 1
OTHER_UID = 2

GAP_ENDPOINTS = [
    ("PATCH", "/api/v1/assessments/7", {"title": "hijacked"}),
    ("POST", "/api/v1/assessments/7/activate", None),
    ("POST", "/api/v1/assessments/7/questions", {"adv_question_id": 1, "display_order": 1, "marks": 1.0}),
    ("DELETE", "/api/v1/assessments/7/questions/6", None),
    ("GET", "/api/v1/admin/dashboard/assessments/7", None),
    ("GET", "/api/v1/admin/dashboard/assessments/7/candidates", None),
    ("GET", "/api/v1/candidate-assessments/1/review-priority", None),
    ("GET", "/api/v1/candidate-assessments/1/metrics-radar", None),
    ("GET", "/api/v1/candidate-assessments/1/metrics", None),
    ("GET", "/api/v1/candidate-responses/1/metrics", None),
    ("GET", "/api/v1/candidate-assessments/1/behavioral-summary", None),
    ("GET", "/api/v1/candidate-assessments/1/metrics-timeline", None),
]

IDS = [f"{method} {url}" for method, url, _ in GAP_ENDPOINTS]


@pytest.fixture
def mock_db():
    owned = MagicMock()
    owned.candidate_id = OWNER_UID
    owned.creator_id = OWNER_UID
    owned.candidate_assess_id = 1
    owned.assessment_id = 7
    owned.status = SessionStatus.IN_PROGRESS
    owned.assessment = MagicMock()
    owned.assessment.assessment_questions = []
    owned.assessment_questions = []
    owned.candidate_assessment = MagicMock()
    owned.candidate_assessment.candidate_id = OWNER_UID

    db = MagicMock()
    q = db.query.return_value
    for chain in [
        q,
        q.filter.return_value,
        q.filter.return_value.filter.return_value,
        q.options.return_value.filter.return_value,
        q.join.return_value.filter.return_value,
        q.filter.return_value.order_by.return_value,
    ]:
        chain.first.return_value = owned
        chain.all.return_value = [owned]
        chain.scalar.return_value = 0
        chain.count.return_value = 0
    return db


def make_client(mock_db, persona=None):
    app.dependency_overrides[get_db] = lambda: mock_db
    if persona is not None:
        app.dependency_overrides[get_current_user] = lambda: persona
    return TestClient(app, raise_server_exceptions=False)


@pytest.fixture
def unauth_client(mock_db):
    app.dependency_overrides.clear()
    yield make_client(mock_db)
    app.dependency_overrides.clear()


@pytest.fixture
def candidate_client(mock_db):
    app.dependency_overrides.clear()
    yield make_client(mock_db, {"user_id": str(OTHER_UID), "role": "CANDIDATE"})
    app.dependency_overrides.clear()


@pytest.fixture
def other_recruiter_client(mock_db):
    app.dependency_overrides.clear()
    yield make_client(mock_db, {"user_id": str(OTHER_UID), "role": "RECRUITER"})
    app.dependency_overrides.clear()


@pytest.mark.parametrize("method,url,body", GAP_ENDPOINTS, ids=IDS)
def test_gap_endpoint_rejects_unauthenticated(unauth_client, method, url, body):
    assert unauth_client.request(method, url, json=body).status_code == 401


@pytest.mark.parametrize("method,url,body", GAP_ENDPOINTS, ids=IDS)
def test_gap_endpoint_rejects_wrong_role(candidate_client, method, url, body):
    assert candidate_client.request(method, url, json=body).status_code == 403


@pytest.mark.xfail(
    strict=False,
    reason="NFR3.1.1 open gap: missing per-recruiter ownership/scoping checks.",
)
@pytest.mark.parametrize("method,url,body", GAP_ENDPOINTS, ids=IDS)
def test_gap_endpoint_rejects_authenticated_not_owner(
    other_recruiter_client, method, url, body
):
    assert other_recruiter_client.request(method, url, json=body).status_code in (403, 404)

