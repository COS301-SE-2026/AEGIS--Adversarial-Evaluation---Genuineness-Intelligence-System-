from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.core.security import create_access_token, hash_token
from app.database.database import get_db as app_get_db
from app.main import app
from app.models import RevokedToken
from app.models.assessment import Assessment


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
