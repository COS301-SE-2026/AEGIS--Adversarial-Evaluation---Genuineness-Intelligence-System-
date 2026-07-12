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

@patch("app.api.routes.test_cases.get_test_cases_by_question_id")
def test_get_test_cases_for_recruiter(mock_get_test_cases):
    mock_case = MagicMock(
        test_case_id=10,
        description="simple case",
        question_id=1,
        input_data="1",
        expected_output="1",
        is_hidden=True,
    )
    mock_get_test_cases.return_value = [mock_case]
    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override("RECRUITER")
    response = client.get("/api/v1/questions/source/1/test-cases")
    app.dependency_overrides.clear()
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert len(body) == 1
    assert body[0]["test_case_id"] == 10
    assert body[0]["question_id"] == 1
    mock_get_test_cases.assert_called_once()

@patch("app.api.routes.test_cases.delete_test_case")
def test_delete_test_case_for_recruiter(mock_delete_test_case):
    mock_delete_test_case.return_value = None
    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override("RECRUITER")
    response = client.delete("/api/v1/questions/adversarial/7/test-cases/11")
    app.dependency_overrides.clear()
    assert response.status_code == 204
    mock_delete_test_case.assert_called_once()

@patch("app.api.routes.test_cases.update_test_case")
def test_update_test_case_for_recruiter(mock_update_test_case):
    mock_case = MagicMock()
    mock_case.test_case_id = 11
    mock_case.description = "updated"
    mock_case.question_id = 42
    mock_case.input_data = "5"
    mock_case.expected_output = "10"
    mock_case.is_hidden = False
    mock_update_test_case.return_value = mock_case
    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override("RECRUITER")
    response = client.patch(
        "/api/v1/questions/adversarial/7/test-cases/11",
        json={
            "description": "updated",
            "input_data": "5",
            "expected_output": "10",
            "is_hidden": False,
        },
    )
    app.dependency_overrides.clear()
    assert response.status_code == 200
    assert response.json()["description"] == "updated"
    mock_update_test_case.assert_called_once()