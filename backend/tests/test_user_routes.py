import os
from unittest.mock import MagicMock, patch

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-client-id")
os.environ.setdefault("GOOGLE_CLIENT_SECRET", "test-client-secret")
os.environ.setdefault("GOOGLE_REDIRECT_URI", "http://localhost:8000/callback")
os.environ.setdefault("GITHUB_CLIENT_ID", "test-github-client-id")
os.environ.setdefault("GITHUB_CLIENT_SECRET", "test-github-client-secret")
os.environ.setdefault("GITHUB_REDIRECT_URI", "http://localhost:8000/github/callback")

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database.database import get_db
from app.core.security import get_current_user

CANDIDATES_PATCH = "app.api.routes.user.get_all_candidates"
USERS_PATCH = "app.api.routes.user.list_users"
CHANGE_ROLE_PATCH = "app.api.routes.user.change_user_role"
UPDATE_USER_PATCH = "app.api.routes.user.update_user"
DELETE_USER_PATCH = "app.api.routes.user.delete_user"


@pytest.fixture
def mock_db():
    return MagicMock()


@pytest.fixture
def client(mock_db):
    app.dependency_overrides[get_db] = lambda: mock_db
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def auth_client(mock_db):
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: {"user_id": "5"}
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def recruiter_client(mock_db):
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: {
        "user_id": "5",
        "role": "RECRUITER",
    }
    yield TestClient(app)
    app.dependency_overrides.clear()


@pytest.fixture
def candidate_client(mock_db):
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: {
        "user_id": "5",
        "role": "CANDIDATE",
    }
    yield TestClient(app)
    app.dependency_overrides.clear()


def _make_mock_user(
    user_id=1,
    email="test@example.com",
    full_name="Test User",
    role="CANDIDATE",
):
    mock_user = MagicMock()
    mock_user.user_id = user_id
    mock_user.email = email
    mock_user.full_name = full_name
    mock_user.role.role_name = role
    return mock_user


def test_list_candidates_returns_200(auth_client, mock_db):
    with patch(CANDIDATES_PATCH, return_value=[]):
        response = auth_client.get("/api/v1/users/candidates")
    assert response.status_code == 200


def test_list_candidates_returns_401_when_no_jwt(client, mock_db):
    response = client.get("/api/v1/users/candidates")
    assert response.status_code == 401


def test_list_candidates_response_items_have_required_fields(
    recruiter_client,
):
    mock_user = _make_mock_user(
        user_id=3,
        email="alice@example.com",
        full_name="Alice Smith",
    )

    with patch(CANDIDATES_PATCH, return_value=[mock_user]):
        response = recruiter_client.get("/api/v1/users/candidates")

    assert response.status_code == 200
    assert response.json() == [
        {
            "user_id": 3,
            "email": "alice@example.com",
            "full_name": "Alice Smith",
        }
    ]


def test_list_candidates_returns_empty_list(recruiter_client):
    with patch(CANDIDATES_PATCH, return_value=[]):
        response = recruiter_client.get("/api/v1/users/candidates")

    assert response.status_code == 200
    assert response.json() == []


def test_list_users_returns_401_when_no_jwt(client):
    response = client.get("/api/v1/users")

    assert response.status_code == 401


def test_list_users_returns_403_for_non_recruiter(candidate_client):
    response = candidate_client.get("/api/v1/users")

    assert response.status_code == 403
    assert response.json()["detail"] == (
        "Only recruiters can manage users."
    )


def test_list_users_returns_users(recruiter_client):
    mock_user = _make_mock_user(
        user_id=3,
        email="alice@example.com",
        full_name="Alice Smith",
    )

    with patch(USERS_PATCH, return_value=[mock_user]):
        response = recruiter_client.get("/api/v1/users")

    assert response.status_code == 200
    assert response.json() == [
        {
            "user_id": 3,
            "email": "alice@example.com",
            "full_name": "Alice Smith",
            "role": "CANDIDATE",
        }
    ]


def test_list_users_passes_search_parameter(recruiter_client, mock_db):
    with patch(USERS_PATCH, return_value=[]) as list_users_mock:
        response = recruiter_client.get(
            "/api/v1/users?search=alice@example.com"
        )

    assert response.status_code == 200
    list_users_mock.assert_called_once_with(
        mock_db,
        search="alice@example.com",
    )


def test_list_users_returns_empty_list(recruiter_client):
    with patch(USERS_PATCH, return_value=[]):
        response = recruiter_client.get("/api/v1/users")

    assert response.status_code == 200
    assert response.json() == []


def test_change_user_role_returns_updated_user(recruiter_client):
    mock_user = _make_mock_user(
        user_id=8,
        email="candidate@example.com",
        full_name="Candidate User",
        role="RECRUITER",
    )

    with patch(CHANGE_ROLE_PATCH, return_value=mock_user):
        response = recruiter_client.patch(
            "/api/v1/users/8/role",
            json={"role": "RECRUITER"},
        )

    assert response.status_code == 200
    assert response.json()["role"] == "RECRUITER"


def test_change_user_role_returns_403_for_non_recruiter(candidate_client):
    response = candidate_client.patch(
        "/api/v1/users/8/role",
        json={"role": "RECRUITER"},
    )

    assert response.status_code == 403


def test_change_user_role_rejects_self(recruiter_client):
    response = recruiter_client.patch(
        "/api/v1/users/5/role",
        json={"role": "CANDIDATE"},
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "You cannot change your own role."
    )


def test_change_user_role_rejects_invalid_role(recruiter_client):
    response = recruiter_client.patch(
        "/api/v1/users/8/role",
        json={"role": "ADMIN"},
    )

    assert response.status_code == 422


def test_change_user_role_returns_404_for_missing_user(recruiter_client):
    with patch(
        CHANGE_ROLE_PATCH,
        side_effect=ValueError("User not found"),
    ):
        response = recruiter_client.patch(
            "/api/v1/users/999/role",
            json={"role": "CANDIDATE"},
        )

    assert response.status_code == 404


def test_edit_user_updates_name_and_email(recruiter_client):
    mock_user = _make_mock_user(
        user_id=8,
        email="updated@example.com",
        full_name="Updated User",
    )

    with patch(UPDATE_USER_PATCH, return_value=mock_user):
        response = recruiter_client.patch(
            "/api/v1/users/8",
            json={
                "email": "updated@example.com",
                "full_name": "Updated User",
            },
        )

    assert response.status_code == 200
    assert response.json()["email"] == "updated@example.com"
    assert response.json()["full_name"] == "Updated User"


def test_edit_user_returns_403_for_non_recruiter(candidate_client):
    response = candidate_client.patch(
        "/api/v1/users/8",
        json={"full_name": "Updated User"},
    )

    assert response.status_code == 403


def test_edit_user_returns_404_for_missing_user(recruiter_client):
    with patch(
        UPDATE_USER_PATCH,
        side_effect=ValueError("User not found"),
    ):
        response = recruiter_client.patch(
            "/api/v1/users/999",
            json={"full_name": "Updated User"},
        )

    assert response.status_code == 404


def test_edit_user_returns_409_for_duplicate_email(recruiter_client):
    with patch(
        UPDATE_USER_PATCH,
        side_effect=ValueError(
            "A user with that email already exists"
        ),
    ):
        response = recruiter_client.patch(
            "/api/v1/users/8",
            json={"email": "existing@example.com"},
        )

    assert response.status_code == 409


def test_delete_user_returns_204(recruiter_client):
    with patch(DELETE_USER_PATCH, return_value=None):
        response = recruiter_client.delete("/api/v1/users/8")

    assert response.status_code == 204
    assert response.content == b""


def test_delete_user_returns_403_for_non_recruiter(candidate_client):
    response = candidate_client.delete("/api/v1/users/8")

    assert response.status_code == 403


def test_delete_user_rejects_self(recruiter_client):
    response = recruiter_client.delete("/api/v1/users/5")

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "You cannot delete your own account."
    )


def test_delete_user_returns_404_for_missing_user(recruiter_client):
    with patch(
        DELETE_USER_PATCH,
        side_effect=ValueError("User not found"),
    ):
        response = recruiter_client.delete("/api/v1/users/999")

    assert response.status_code == 404


def test_delete_user_returns_409_when_related_records_exist(
    recruiter_client,
):
    with patch(
        DELETE_USER_PATCH,
        side_effect=ValueError(
            "This user cannot be deleted because they have related records"
        ),
    ):
        response = recruiter_client.delete("/api/v1/users/8")

    assert response.status_code == 409


def test_list_candidates_returns_200(recruiter_client):
    with patch(CANDIDATES_PATCH, return_value=[]):
        response = recruiter_client.get("/api/v1/users/candidates")

    assert response.status_code == 200
