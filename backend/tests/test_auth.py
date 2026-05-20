import os

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-client-id")
os.environ.setdefault("GOOGLE_CLIENT_SECRET", "test-client-secret")
os.environ.setdefault("GOOGLE_REDIRECT_URI", "http://localhost:8000/callback")
os.environ.setdefault("GITHUB_CLIENT_ID", "test-github-client-id")
os.environ.setdefault("GITHUB_CLIENT_SECRET", "test-github-client-secret")
os.environ.setdefault("GITHUB_REDIRECT_URI", "http://localhost:8000/github/callback")


from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database.database import get_db

_REGISTER_PATCH = "app.api.routes.auth.register_user"


@pytest.fixture
def mock_db():
    return MagicMock()


@pytest.fixture
def client(mock_db):
    app.dependency_overrides[get_db] = lambda: mock_db
    yield TestClient(app)
    app.dependency_overrides.clear()


def _make_mock_user(user_id=1, email="test@example.com", full_name="Test User"):
    """Build a mock User object that matches what register_user returns."""
    mock_user = MagicMock()
    mock_user.user_id = user_id
    mock_user.email = email
    mock_user.full_name = full_name
    return mock_user

def test_register_returns_201(client):
    mock_user = _make_mock_user()
    mock_token = "mocked.jwt.token"

    with patch(_REGISTER_PATCH, return_value=(mock_user, mock_token)):
        response = client.post(
            "/api/v1/auth/register",
            json={"email": "test@example.com", "password": "Test1234!"},
        )

    assert response.status_code == 201


def test_register_response_contains_access_token(client):
    mock_user = _make_mock_user()
    mock_token = "mocked.jwt.token"

    with patch(_REGISTER_PATCH, return_value=(mock_user, mock_token)):
        response = client.post(
            "/api/v1/auth/register",
            json={"email": "test@example.com", "password": "Test1234!"},
        )

    body = response.json()
    assert "access_token" in body
    assert body["access_token"] == mock_token
    assert body["token_type"] == "bearer"


def test_register_response_contains_user(client):
    mock_user = _make_mock_user(user_id=5, email="test@example.com", full_name="Test User")
    mock_token = "mocked.jwt.token"

    with patch(_REGISTER_PATCH, return_value=(mock_user, mock_token)):
        response = client.post(
            "/api/v1/auth/register",
            json={"email": "test@example.com", "password": "Test1234!"},
        )

    body = response.json()
    assert "user" in body
    assert body["user"]["id"] == 5
    assert body["user"]["email"] == "test@example.com"
    assert body["user"]["full_name"] == "Test User"


def test_register_with_full_name(client):
    mock_user = _make_mock_user(full_name="Sambulo Dube")
    mock_token = "mocked.jwt.token"

    with patch(_REGISTER_PATCH, return_value=(mock_user, mock_token)):
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "password": "Test1234!",
                "full_name": "Sambulo Dube",
            },
        )

    assert response.status_code == 201
    assert response.json()["user"]["full_name"] == "Sambulo Dube"


def test_register_returns_409_when_email_already_exists(client):
    from fastapi import HTTPException

    with patch(
        _REGISTER_PATCH,
        side_effect=HTTPException(
            status_code=409,
            detail="An account with this email already exists",
        ),
    ):
        response = client.post(
            "/api/v1/auth/register",
            json={"email": "existing@example.com", "password": "Test1234!"},
        )

    assert response.status_code == 409
    assert "already exists" in response.json()["detail"]


# --- Password validation (handled by Pydantic, no patch needed) ---

def test_register_returns_422_when_password_too_short(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "Ab1!"},
    )
    assert response.status_code == 422


def test_register_returns_422_when_password_missing_uppercase(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "test1234!"},
    )
    assert response.status_code == 422


def test_register_returns_422_when_password_missing_number(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com", "password": "Testtest!"},
    )
    assert response.status_code == 422


def test_register_returns_422_when_email_invalid(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "notanemail", "password": "Test1234!"},
    )
    assert response.status_code == 422


def test_register_returns_422_when_email_missing(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"password": "Test1234!"},
    )
    assert response.status_code == 422


def test_register_returns_422_when_password_missing(client):
    response = client.post(
        "/api/v1/auth/register",
        json={"email": "test@example.com"},
    )
    assert response.status_code == 422

def test_register_returns_500_when_candidate_role_missing(client):
    with patch(
        _REGISTER_PATCH,
        side_effect=ValueError("CANDIDATE role not found"),
    ):
        response = client.post(
            "/api/v1/auth/register",
            json={"email": "test@example.com", "password": "Test1234!"},
        )

    assert response.status_code == 500