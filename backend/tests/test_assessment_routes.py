import os
from datetime import datetime
from unittest.mock import MagicMock

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-client-id")
os.environ.setdefault("GOOGLE_CLIENT_SECRET", "test-client-secret")
os.environ.setdefault("GOOGLE_REDIRECT_URI", "http://localhost:8000/callback")

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.database.database import get_db


@pytest.fixture
def mock_db():
    return MagicMock()


@pytest.fixture
def client(mock_db):
    app.dependency_overrides[get_db] = lambda: mock_db
    yield TestClient(app)
    app.dependency_overrides.clear()


def _setup_list(mock_db, assessments):
    mock_db.query.return_value.all.return_value = assessments


def _setup_by_id(mock_db, assessment):
    (
        mock_db.query.return_value
        .options.return_value
        .filter.return_value
        .first.return_value
    ) = assessment


def test_list_assessments_returns_200_with_list(client, mock_db):
    mock_a = MagicMock()
    mock_a.assessment_id = 1
    mock_a.title = "Test Assessment"
    mock_a.description = "A description"
    mock_a.duration_mins = 60
    mock_a.created_at = datetime(2025, 1, 1)

    _setup_list(mock_db, [mock_a])
    response = client.get("/api/v1/assessments/")

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert len(body) == 1
    assert body[0]["assessment_id"] == 1
    assert body[0]["title"] == "Test Assessment"


def test_list_assessments_returns_empty_list(client, mock_db):
    _setup_list(mock_db, [])
    response = client.get("/api/v1/assessments/")

    assert response.status_code == 200
    assert response.json() == []


def test_get_assessment_returns_200_with_correct_data(client, mock_db):
    mock_a = MagicMock()
    mock_a.assessment_id = 42
    mock_a.title = "Python Basics"
    mock_a.description = "Fundamentals test"
    mock_a.duration_mins = 45
    mock_a.created_at = datetime(2025, 6, 1)
    mock_a.assessment_questions = []

    _setup_by_id(mock_db, mock_a)
    response = client.get("/api/v1/assessments/42")

    assert response.status_code == 200
    body = response.json()
    assert body["assessment_id"] == 42
    assert body["title"] == "Python Basics"


def test_get_assessment_returns_404_when_not_found(client, mock_db):
    _setup_by_id(mock_db, None)
    response = client.get("/api/v1/assessments/999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Assessment not found"


def test_get_assessment_includes_questions_list(client, mock_db):
    mock_qb = MagicMock()
    mock_qb.question_bank_id = 10
    mock_qb.title = "What is X?"
    mock_qb.content = "Explain X."
    mock_qb.type.value = "TEXT"
    mock_qb.maximum_score = 5.0
    mock_qb.tags = ["python"]

    mock_aq = MagicMock()
    mock_aq.assessment_q_id = 7
    mock_aq.display_order = 1
    mock_aq.marks = 5.0
    mock_aq.question_bank = mock_qb

    mock_a = MagicMock()
    mock_a.assessment_id = 1
    mock_a.title = "Test"
    mock_a.description = None
    mock_a.duration_mins = 30
    mock_a.created_at = datetime(2025, 1, 1)
    mock_a.assessment_questions = [mock_aq]

    _setup_by_id(mock_db, mock_a)
    response = client.get("/api/v1/assessments/1")

    assert response.status_code == 200
    body = response.json()
    assert "questions" in body
    assert isinstance(body["questions"], list)
    assert len(body["questions"]) == 1
    q = body["questions"][0]
    assert q["assessment_q_id"] == 7
    assert q["title"] == "What is X?"
    assert q["type"] == "TEXT"
