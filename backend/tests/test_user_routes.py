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


def _make_mock_user(user_id=1, email="test@example.com", full_name="Test User"):
    mock_user = MagicMock()
    mock_user.user_id = user_id
    mock_user.email = email
    mock_user.full_name = full_name
    return mock_user


def test_list_candidates_returns_200(auth_client, mock_db):
    with patch(CANDIDATES_PATCH, return_value=[]):
        response = auth_client.get("/api/v1/users/candidates")
    assert response.status_code == 200


def test_list_candidates_returns_401_when_no_jwt(client, mock_db):
    response = client.get("/api/v1/users/candidates")
    assert response.status_code == 401


def test_list_candidates_response_items_have_required_fields(auth_client, mock_db):
    mock_user = _make_mock_user(user_id=3, email="alice@example.com", full_name="Alice Smith")
    with patch(CANDIDATES_PATCH, return_value=[mock_user]):
        response = auth_client.get("/api/v1/users/candidates")
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    item = body[0]
    assert item["user_id"] == 3
    assert item["email"] == "alice@example.com"
    assert item["full_name"] == "Alice Smith"


def test_list_candidates_returns_empty_list_when_no_candidates(auth_client, mock_db):
    with patch(CANDIDATES_PATCH, return_value=[]):
        response = auth_client.get("/api/v1/users/candidates")
    assert response.status_code == 200
    assert response.json() == []
