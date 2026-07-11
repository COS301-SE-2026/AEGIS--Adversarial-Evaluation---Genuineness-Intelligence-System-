import os
from unittest.mock import MagicMock, patch
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-client-id")
os.environ.setdefault("GOOGLE_CLIENT_SECRET", "test-client-secret")
os.environ.setdefault("GOOGLE_REDIRECT_URI", "http://localhost:8000/callback")
from fastapi.testclient import TestClient
from app.core.security import get_current_user
from app.database.database import get_db
from app.main import app

client = TestClient(app)

def _db_override():
    mock_db = MagicMock()
    yield mock_db

def _auth_override(role: str):
    def get_current_user_mock():
        return {"role": role, "user_id": "1", "sub": "test@tuks.co.za"}
    return get_current_user_mock

@patch("app.api.routes.test_cases.get_test_cases_by_question_id")
def test_get_test_cases_forbidden_for_candidate(mock_get_test_cases):
    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override("CANDIDATE")
    response = client.get("/api/v1/questions/source/1/test-cases")
    app.dependency_overrides.clear()
    assert response.status_code == 403
    mock_get_test_cases.assert_not_called()