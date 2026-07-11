import os
from unittest.mock import MagicMock, patch
import pytest
from fastapi import HTTPException
from fastapi.testclient import TestClient
from app.main import app
from app.database.database import get_db
from app.core.security import get_current_user
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("SECRET_KEY", "test-secret-key")

@pytest.fixture
def mock_db():
    return MagicMock()

@pytest.fixture
def candidate_client(mock_db):
    def override_get_db():
        return mock_db
    
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()

@pytest.fixture
def auth_client(mock_db):
    def override_get_db():
        return mock_db
    
    def override_get_current_user():
        return {"user_id": "1"}
    
    app.dependency_overrides[get_db] = override_get_db
    app.dependency_overrides[get_current_user] = override_get_current_user

    yield TestClient(app)
    app.dependency_overrides.clear()

_GET_SESSION_PATCH = "app.api.routes.candidate.get_candidate_assessment_session"
_UPDATE_RESPONSE_PATCH = "app.api.routes.candidate.update_response"

def test_get_ass_sess_returns_200(auth_client, mock_db):
    mock_session = MagicMock()
    mock_session.candidate_assess_id = 10
    mock_session.status = "IN_PROGRESS"

    with patch(_GET_SESSION_PATCH, return_value=mock_session):
        response = auth_client.get("/api/v1/candidates/assessments/10")
    
    body = response.json()
    assert response.status_code == 200
    assert body["candidate_assess_id"] == 10
    assert body["status"] == "IN_PROGRESS"

def test_get_ass_sess_returns_404(auth_client, mock_db):
    error = HTTPException(status_code=404, detail="Assessment session not found")
    with patch(_GET_SESSION_PATCH, side_effect=error):
        response = auth_client.get("/api/v1/candidates/assessments/999") 

    assert response.status_code == 404
    assert response.json()["detail"] == "Assessment session not found"

def test_get_ass_sess_returns_403_invalid_token(auth_client, mock_db):
    error = HTTPException(status_code=403, detail="Invalid token")
    with patch(_GET_SESSION_PATCH, side_effect=error):
        response = auth_client.get("/api/v1/candidates/assessments/10")
    
    assert response.status_code == 403
    assert response.json()["detail"] == "Invalid token"

def test_get_ass_sess_returns_401_without_jwt(client, mock_db):
    response = client.get("/api/v1/candidates/assessments/10")
    
    assert response.status_code == 401

def test_udpate_returns_200(auth_client, mock_db):
    mock_response = MagicMock()
    mock_response.response_id = 5
    mock_response.candidate_answer = 42

    with patch(_UPDATE_RESPONSE_PATCH, return_value=mock_response):
        response = auth_client.patch(
            "/api/v1/candidates/responses/5",
            json={"candidate_answer": 42}
        )

    assert response.status_code == 200
    assert response.json()["response_id"] == 5

def test_update_returns_404(auth_client, mock_db):
    error = HTTPException(status_code=404, detail="Response not found")
    with patch(_UPDATE_RESPONSE_PATCH, side_effect=error):
        response = auth_client.patch(
            "/api/v1/candidates/responses/999",
            json={"candidate_answer": 42}
        )

    assert response.status_code == 404
    assert response.json()["detail"] == "Response not found"

def test_update_returns_403(auth_client, mock_db):
    error = HTTPException(status_code=403, detail="Not authenticated for this assessment")
    with patch(_UPDATE_RESPONSE_PATCH, side_effect=error):
        response = auth_client.patch(
            "/api/v1/candidates/responses/5",
            json={"candidate_answer": 42}
        )

    assert response.status_code == 403
    assert response.json()["detail"] == "Not authenticated for this assessment"

def test_update_returns_401(client, mock_db):
    response = client.patch(
        "/api/v1/candidates/responses/5",
        json={"candidate_answer": 42}
    )

    assert response.status_code == 401