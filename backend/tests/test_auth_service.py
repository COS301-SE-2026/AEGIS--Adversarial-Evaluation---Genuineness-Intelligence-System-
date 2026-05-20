import os

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-client-id")
os.environ.setdefault("GOOGLE_CLIENT_SECRET", "test-client-secret")
os.environ.setdefault("GOOGLE_REDIRECT_URI", "http://localhost:8000/callback")
os.environ.setdefault("GITHUB_CLIENT_ID", "test-github-client-id")
os.environ.setdefault("GITHUB_CLIENT_SECRET", "test-github-client-secret")
os.environ.setdefault("GITHUB_REDIRECT_URI", "http://localhost:8000/github/callback")
os.environ.setdefault("FRONTEND_URL", "http://localhost:3000")

import pytest
from unittest.mock import MagicMock, patch
from fastapi import HTTPException

from app.services.auth import register_user, login_user
from app.schema.auth import RegisterRequest, LoginRequest


def _mock_db():
    return MagicMock()


def _make_mock_role(role_id=1, role_name="CANDIDATE"):
    role = MagicMock()
    role.role_id = role_id
    role.role_name = role_name
    return role


def _make_mock_user(user_id=1, email="test@example.com", full_name="Test User", password_hash=None):
    user = MagicMock()
    user.user_id = user_id
    user.email = email
    user.full_name = full_name
    user.password_hash = password_hash
    user.role = _make_mock_role()
    return user


def _make_register_payload(**kwargs):
    defaults = {"email": "test@example.com", "password": "Test1234!", "full_name": "Test User"}
    return RegisterRequest(**{**defaults, **kwargs})


def _make_login_payload(**kwargs):
    defaults = {"email": "test@example.com", "password": "Test1234!"}
    return LoginRequest(**{**defaults, **kwargs})


def test_register_user_returns_user_and_token():
    db = _mock_db()
    mock_role = _make_mock_role()

    db.query.return_value.filter.return_value.first.side_effect = [
        None,
        mock_role,
    ]

    payload = _make_register_payload()

    with patch("app.services.auth.hash_password", return_value="hashed"):
        with patch("app.services.auth.create_access_token", return_value="token"):
            user, token = register_user(db, payload)

    assert token == "token"
    assert db.add.called
    assert db.commit.called


def test_register_user_raises_409_when_email_exists():
    db = _mock_db()
    existing_user = _make_mock_user()

    db.query.return_value.filter.return_value.first.return_value = existing_user

    payload = _make_register_payload()

    with pytest.raises(HTTPException) as exc:
        register_user(db, payload)

    assert exc.value.status_code == 409
    assert "already exists" in exc.value.detail


def test_register_user_raises_500_when_candidate_role_missing():
    db = _mock_db()

    db.query.return_value.filter.return_value.first.side_effect = [
        None,
        None,
    ]

    payload = _make_register_payload()

    with patch("app.services.auth.hash_password", return_value="hashed"):
        with pytest.raises(ValueError, match="CANDIDATE role not found"):
            register_user(db, payload)


def test_register_user_hashes_password():
    db = _mock_db()
    mock_role = _make_mock_role()

    db.query.return_value.filter.return_value.first.side_effect = [None, mock_role]

    payload = _make_register_payload(password="Test1234!")

    with patch("app.services.auth.hash_password", return_value="hashed") as mock_hash:
        with patch("app.services.auth.create_access_token", return_value="token"):
            register_user(db, payload)

    mock_hash.assert_called_once_with("Test1234!")


def test_login_user_returns_user_and_token():
    db = _mock_db()
    mock_user = _make_mock_user(password_hash="hashed")

    db.query.return_value.filter.return_value.first.return_value = mock_user

    payload = _make_login_payload()

    with patch("app.services.auth.verify_password", return_value=True):
        with patch("app.services.auth.create_access_token", return_value="token"):
            user, token = login_user(db, payload)

    assert user == mock_user
    assert token == "token"


def test_login_user_raises_401_when_user_not_found():
    db = _mock_db()

    db.query.return_value.filter.return_value.first.return_value = None

    payload = _make_login_payload()

    with pytest.raises(HTTPException) as exc:
        login_user(db, payload)

    assert exc.value.status_code == 401
    assert exc.value.detail == "Invalid email or password"


def test_login_user_raises_401_when_no_password_hash():
    db = _mock_db()
    mock_user = _make_mock_user(password_hash=None)

    db.query.return_value.filter.return_value.first.return_value = mock_user

    payload = _make_login_payload()

    with pytest.raises(HTTPException) as exc:
        login_user(db, payload)

    assert exc.value.status_code == 401
    assert exc.value.detail == "Invalid email or password"


def test_login_user_raises_401_when_password_wrong():
    db = _mock_db()
    mock_user = _make_mock_user(password_hash="hashed")

    db.query.return_value.filter.return_value.first.return_value = mock_user

    payload = _make_login_payload()

    with patch("app.services.auth.verify_password", return_value=False):
        with pytest.raises(HTTPException) as exc:
            login_user(db, payload)

    assert exc.value.status_code == 401
    assert exc.value.detail == "Invalid email or password"


def test_login_user_calls_verify_password_with_correct_args():
    db = _mock_db()
    mock_user = _make_mock_user(password_hash="hashed")

    db.query.return_value.filter.return_value.first.return_value = mock_user

    payload = _make_login_payload(password="Test1234!")

    with patch("app.services.auth.verify_password", return_value=True) as mock_verify:
        with patch("app.services.auth.create_access_token", return_value="token"):
            login_user(db, payload)

    mock_verify.assert_called_once_with("Test1234!", "hashed")


def test_get_or_create_user_returns_existing_user_via_oauth():
    from app.services.auth import get_or_create_user

    db = _mock_db()
    mock_user = _make_mock_user()
    mock_oauth = MagicMock()
    mock_oauth.user = mock_user

    db.query.return_value.filter.return_value.first.return_value = mock_oauth

    user_info = {
        "id": "google-123",
        "email": "test@example.com",
        "name": "Test User",
        "access_token": "google-token",
    }

    result = get_or_create_user(db, user_info)

    assert result == mock_user


def test_get_or_create_user_links_existing_email_user():
    from app.services.auth import get_or_create_user

    db = _mock_db()
    mock_user = _make_mock_user()

    db.query.return_value.filter.return_value.first.side_effect = [
        None,
        mock_user,
    ]

    user_info = {
        "id": "google-123",
        "email": "test@example.com",
        "name": "Test User",
        "access_token": "google-token",
    }

    result = get_or_create_user(db, user_info)

    assert result == mock_user
    assert db.add.called
    assert db.commit.called


def test_get_or_create_user_creates_new_user():
    from app.services.auth import get_or_create_user

    db = _mock_db()
    mock_role = _make_mock_role()

    db.query.return_value.filter.return_value.first.side_effect = [
        None,
        None,
        mock_role,
    ]

    user_info = {
        "id": "google-123",
        "email": "new@example.com",
        "name": "New User",
        "access_token": "google-token",
    }

    get_or_create_user(db, user_info)

    assert db.add.called
    assert db.flush.called
    assert db.commit.called


def test_get_or_create_user_raises_when_candidate_role_missing():
    from app.services.auth import get_or_create_user

    db = _mock_db()

    db.query.return_value.filter.return_value.first.side_effect = [
        None,
        None,
        None,
    ]

    user_info = {
        "id": "google-123",
        "email": "new@example.com",
        "name": "New User",
        "access_token": "google-token",
    }

    with pytest.raises(ValueError, match="CANDIDATE role not found in roles table"):
        get_or_create_user(db, user_info)


def test_get_or_create_user_uses_sub_when_id_missing():
    from app.services.auth import get_or_create_user

    db = _mock_db()
    mock_user = _make_mock_user()
    mock_oauth = MagicMock()
    mock_oauth.user = mock_user

    db.query.return_value.filter.return_value.first.return_value = mock_oauth

    user_info = {
        "sub": "google-sub-456",
        "email": "test@example.com",
        "name": "Test User",
        "access_token": "google-token",
    }

    result = get_or_create_user(db, user_info)

    assert result == mock_user


def test_hash_password_returns_string():
    from app.core.security import hash_password

    result = hash_password("Test1234!")
    assert isinstance(result, str)
    assert result != "Test1234!"


def test_verify_password_returns_true_for_correct_password():
    from app.core.security import hash_password, verify_password

    hashed = hash_password("Test1234!")
    assert verify_password("Test1234!", hashed) is True


def test_verify_password_returns_false_for_wrong_password():
    from app.core.security import hash_password, verify_password

    hashed = hash_password("Test1234!")
    assert verify_password("Wrong1234!", hashed) is False


def test_create_access_token_returns_string():
    from app.core.security import create_access_token

    token = create_access_token({"sub": "1", "email": "test@example.com"})
    assert isinstance(token, str)
    assert len(token) > 0


def test_create_access_token_is_decodable():
    from app.core.security import create_access_token, verify_access_token

    payload = {"sub": "1", "email": "test@example.com"}
    token = create_access_token(payload)
    decoded = verify_access_token(token)

    assert decoded["sub"] == "1"
    assert decoded["email"] == "test@example.com"


def test_verify_access_token_raises_on_invalid_token():
    from fastapi import HTTPException
    from app.core.security import verify_access_token

    with pytest.raises(HTTPException) as exc:
        verify_access_token("not.a.valid.token")

    assert exc.value.status_code == 401