from unittest.mock import MagicMock

import pytest
from fastapi.testclient import TestClient
from fastapi import HTTPException
from sqlalchemy.exc import IntegrityError
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import create_access_token, hash_token
from app.database.database import get_db as app_get_db
from app.main import app
from app.models import RevokedToken
from app.models.assessment import Assessment
from app.services.auth import logout_user


def create_logout_client():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    RevokedToken.__table__.create(bind=engine)
    Assessment.__table__.create(bind=engine)
    session_factory = sessionmaker(
        autocommit=False,
        autoflush=False,
        bind=engine,
    )

    def override_get_db():
        db = session_factory()
        try:
            yield db
        finally:
            db.close()

    app.dependency_overrides[app_get_db] = override_get_db
    return TestClient(app), session_factory, engine


def remove_logout_overrides(engine):
    app.dependency_overrides.clear()
    engine.dispose()


def test_logout_revokes_token_for_protected_routes():
    client, session_factory, engine = create_logout_client()
    token = create_access_token({"sub": "user-1"})
    headers = {"Authorization": f"Bearer {token}"}

    try:
        before_logout = client.get(
            "/api/v1/assessments/1",
            headers=headers,
        )
        assert before_logout.status_code == 404

        response = client.post("/api/v1/auth/logout", headers=headers)
        assert response.status_code == 200
        assert response.json() == {"message": "Logged out successfully"}

        with session_factory() as db:
            stored_token = db.query(RevokedToken).one()
            assert stored_token.token_hash == hash_token(token)
            assert stored_token.token_hash != token

        protected_response = client.get(
            "/api/v1/assessments/1",
            headers=headers,
        )
        assert protected_response.status_code == 401
    finally:
        remove_logout_overrides(engine)


def test_logout_is_idempotent():
    client, _, engine = create_logout_client()
    token = create_access_token({"sub": "user-1"})
    headers = {"Authorization": f"Bearer {token}"}

    try:
        first_response = client.post("/api/v1/auth/logout", headers=headers)
        second_response = client.post("/api/v1/auth/logout", headers=headers)

        assert first_response.status_code == 200
        assert second_response.status_code == 200
    finally:
        remove_logout_overrides(engine)


def test_logout_requires_a_token():
    client, _, engine = create_logout_client()

    try:
        response = client.post("/api/v1/auth/logout")
        assert response.status_code == 401
    finally:
        remove_logout_overrides(engine)


def test_logout_rejects_token_without_expiration_claim(monkeypatch):
    db = MagicMock()
    token = create_access_token({"sub": "user-1"})
    revoked_check = MagicMock(return_value=False)
    monkeypatch.setattr("app.services.auth.is_token_revoked", revoked_check)

    with pytest.raises(HTTPException) as error:
        logout_user(db, token, {})

    assert error.value.status_code == 401
    db.add.assert_not_called()
    db.commit.assert_not_called()


def test_logout_rejects_token_with_invalid_expiration_claim(monkeypatch):
    db = MagicMock()
    token = create_access_token({"sub": "user-1"})
    revoked_check = MagicMock(return_value=False)
    monkeypatch.setattr("app.services.auth.is_token_revoked", revoked_check)

    with pytest.raises(HTTPException) as error:
        logout_user(db, token, {"exp": "not-a-timestamp"})

    assert error.value.status_code == 401
    db.add.assert_not_called()
    db.commit.assert_not_called()


def test_logout_handles_concurrent_duplicate_revocation(monkeypatch):
    db = MagicMock()
    token = create_access_token({"sub": "user-1"})
    db.commit.side_effect = IntegrityError(
        "commit",
        {},
        Exception("duplicate token hash"),
    )
    revoked_check = MagicMock(side_effect=[False, True])
    monkeypatch.setattr("app.services.auth.is_token_revoked", revoked_check)

    logout_user(db, token, {"exp": 2_000_000_000})

    db.rollback.assert_called_once()
    assert revoked_check.call_count == 2


def test_logout_reraises_database_integrity_error_when_not_revoked(
    monkeypatch,
):
    db = MagicMock()
    token = create_access_token({"sub": "user-1"})
    database_error = IntegrityError(
        "commit",
        {},
        Exception("database integrity failure"),
    )
    db.commit.side_effect = database_error
    revoked_check = MagicMock(return_value=False)
    monkeypatch.setattr("app.services.auth.is_token_revoked", revoked_check)

    with pytest.raises(IntegrityError) as error:
        logout_user(db, token, {"exp": 2_000_000_000})

    assert error.value is database_error
    db.rollback.assert_called_once()
    assert revoked_check.call_count == 2
