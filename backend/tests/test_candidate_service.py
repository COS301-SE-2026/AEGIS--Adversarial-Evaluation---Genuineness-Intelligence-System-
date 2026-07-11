import os
from datetime import datetime
from unittest.mock import MagicMock
import pytest
from fastapi.testclient import TestClient

from app.core.security import get_current_user
from app.database.database import get_db
from app.main import app
from app.models.candidate_assessment import SessionStatus
from app.models.candidate_response import CorrectnessStatus

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-client-id")
os.environ.setdefault("GOOGLE_CLIENT_SECRET", "test-client-secret")
os.environ.setdefault("GOOGLE_REDIRECT_URI", "http://localhost:8000/callback")
os.environ.setdefault("GITHUB_CLIENT_ID", "test-github-client-id")
os.environ.setdefault("GITHUB_CLIENT_SECRET", "test-github-client-secret")
os.environ.setdefault("GITHUB_REDIRECT_URI", "http://localhost:8000/github/callback")

@pytest.fixture
def mock_db():
    return MagicMock()

@pytest.fixture
def candidate_client(mock_db):
    def override_get_db():
        return mock_db
    
    def override_get_current_user():
        return {"user_id": "5"}
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    yield TestClient(app)
    app.dependency_overrides.clear()

def test_get_cand_ass_returns_sess(candidate_client, mock_db):
    session = MagicMock()
    session.candidate_assess_id = 42
    session.status = SessionStatus.STARTED
    session.access_token = "access-token"
    session.total_score = 10.5
    session.start_time = datetime(2025, 1, 1, 12, 0, 0)
    session.end_time = datetime(2025, 1, 1, 13, 0, 0)
    session.candidate_id = 5

    mock_db.query.return_value.filter.return_value.first.return_value = session
    
    response = candidate_client.get("/api/v1/candidate/assessments/42")
    assert response.status_code == 200

    body = response.json()
    assert body["candidate_assess_id"] == 42
    assert body["status"] == "STARTED"
    assert body["access_token"] == "access-token"
    assert body["total_score"] == 10.5

def test_ass_returns_404_for_missin_sess(candidate_client, mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None
    response = candidate_client.get("/api/v1/candidate/assessments/999")

    assert response.status_code == 404
    assert response.json() == {"detail": "Assessment session not found"}

def test_update_candidate_response(candidate_client, mock_db):
    response_record = MagicMock()
    response_record.response_id = 77
    response_record.candidate_assessment_id = 42
    response_record.assessment_question_id = 12
    response_record.candidate_answer = "old answer"
    response_record.score = 0
    response_record.is_correct = CorrectnessStatus.CORRECT
    response_record.candidate_assessment = MagicMock()
    response_record.candidate_assessment.candidate_id = 5

    mock_db.query.return_value.filter.return_value.first.return_value = response_record

    response = candidate_client.put(
        "/api/v1/candidate/responses/77",
        json={"candidate_answer": "new answer"},
    )

    body = response.json()

    assert response.status_code == 200
    assert body["response_id"] == 77
    assert body["candidate_answer"] == "new answer"
    assert body["is_correct"] == "CORRECT"
    assert response_record.candidate_answer == "new answer"

    mock_db.commit.assert_called_once()

def test_returns_403_for_unauth_candidate(candidate_client, mock_db):
    response_record = MagicMock()
    response_record.response_id = 77
    response_record.candidate_assessment_id = 42
    response_record.assessment_question_id = 12
    response_record.candidate_answer = "old answer"
    response_record.score = 0.0
    response_record.is_correct = None
    response_record.candidate_assessment = MagicMock()
    response_record.candidate_assessment.candidate_id = 99
    mock_db.query.return_value.filter.return_value.first.return_value = response_record

    response = candidate_client.put(
        "/api/v1/candidate/responses/77",
        json={"candidate_answer": "new answer"},
    )

    assert response.status_code == 403
    assert response.json() == {"detail": "Not authenticated for this assessment"}

def test_get_cand_ass_returns_403_for_unauth_candidate(candidate_client, mock_db):
    session = MagicMock()
    session.candidate_assess_id = 42
    session.status = SessionStatus.STARTED
    session.access_token = "access-token"
    session.total_score = None
    session.start_time = None
    session.end_time = None
    session.candidate_id = 99
    mock_db.query.return_value.filter.return_value.first.return_value = session

    response = candidate_client.get("/api/v1/candidate/assessments/42")

    assert response.status_code == 403
    assert response.json() == {"detail": "Invalid token"}

def test_update_response_returns_404_for_missing_response(candidate_client, mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None

    response = candidate_client.put(
        "/api/v1/candidate/responses/999",
        json={"candidate_answer": "new answer"},
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Response not found"}
