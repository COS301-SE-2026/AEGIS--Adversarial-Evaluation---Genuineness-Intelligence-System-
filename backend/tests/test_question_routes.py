import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app
from app.core.security import get_current_user
from app.database.database import get_db

client = TestClient(app)

def _auth_override(role: str):
    def get_current_user_mock():
        return {"role": role, "user_id": "1", "sub": "test@tuks.co.za"}
    return get_current_user_mock

def _db_override():
    mock_db = MagicMock()
    yield mock_db


@patch("app.api.routes.question.get_all_categories")
def test_list_categories_returns_data(mock_get_all):
    mock_get_all.return_value = [
        MagicMock(category_id=1, category_name="Algorithms", created_at="2024-01-15T10:30:00")
    ]

    app.dependency_overrides[get_current_user] = _auth_override("recruiter")
    app.dependency_overrides[get_db] = _db_override
    response = client.get("/api/v1/categories/")
    app.dependency_overrides.clear()

    assert response.status_code == 200


@patch("app.api.routes.question.delete_source_question")
def test_delete_question_forbidden_for_candidate(mock_delete):
    app.dependency_overrides[get_current_user] = _auth_override("CANDIDATE")
    app.dependency_overrides[get_db] = _db_override
    response = client.delete("/api/v1/questions/1")
    app.dependency_overrides.clear()

    assert response.status_code == 403
    mock_delete.assert_not_called()


@patch("app.api.routes.question.delete_source_question")
def test_delete_question_success_as_recruiter(mock_delete):
    mock_delete.return_value = None

    app.dependency_overrides[get_current_user] = _auth_override("recruiter")
    app.dependency_overrides[get_db] = _db_override
    response = client.delete("/api/v1/questions/1")
    app.dependency_overrides.clear()

    assert response.status_code == 204
    mock_delete.assert_called_once()

@patch("app.api.routes.test_cases.update_test_case")
def test_update_test_case_for_candidate(mock_update_test_case):
    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override("CANDIDATE")
    response = client.patch(
        "/api/v1/questions/source/7/test-cases/11",
        json={
            "description": "updated",
            "input_data": "5",
            "expected_output": "10",
            "is_hidden": False,
        },
    )
    app.dependency_overrides.clear()
    assert response.status_code == 403
    mock_update_test_case.assert_not_called()

@patch("app.api.routes.test_cases.create_test_case")
def test_create_test_case_for_candidate(mock_create_test_case):
    app.dependency_overrides[get_db] = _db_override
    app.dependency_overrides[get_current_user] = _auth_override("CANDIDATE")
    response = client.post(
        "/api/v1/questions/source/7/test-cases",
        json={
            "description": "addition",
            "input_data": "5",
            "expected_output": "10",
            "is_hidden": False,
        },
    )
    app.dependency_overrides.clear()
    assert response.status_code == 403
    mock_create_test_case.assert_not_called()