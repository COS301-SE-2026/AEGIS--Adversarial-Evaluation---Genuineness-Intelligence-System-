import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from app.main import app

client = TestClient(app)

def _auth_override(role: str):
    """Returns a dependency override that simulates a logged-in user."""
    def get_current_user_mock():
        return {"role": role, "user_id": "1", "sub": "test@tuks.co.za"}
    return get_current_user_mock


@patch("app.services.question.get_all_categories")
def test_list_categories_returns_data(mock_get_all):
    from app.core.security import get_current_user

    mock_category = MagicMock()
    mock_category.category_id = 1
    mock_category.category_name = "Algorithms"
    mock_category.created_at = "2024-01-15T10:30:00"
    mock_get_all.return_value = [mock_category]

    app.dependency_overrides[get_current_user] = _auth_override("recruiter")
    response = client.get("/api/v1/categories/")
    app.dependency_overrides.clear()

    assert response.status_code == 200


@patch("app.api.routes.question.delete_source_question")
def test_delete_question_forbidden_for_candidate(mock_delete):
    from app.core.security import get_current_user

    app.dependency_overrides[get_current_user] = _auth_override("CANDIDATE")
    response = client.delete("/api/v1/questions/1")
    app.dependency_overrides.clear()

    assert response.status_code == 403
    mock_delete.assert_not_called()


@patch("app.api.routes.question.delete_source_question")
def test_delete_question_success_as_recruiter(mock_delete):
    from app.core.security import get_current_user

    mock_delete.return_value = None
    app.dependency_overrides[get_current_user] = _auth_override("recruiter")
    response = client.delete("/api/v1/questions/1")
    app.dependency_overrides.clear()

    assert response.status_code == 204
    mock_delete.assert_called_once()