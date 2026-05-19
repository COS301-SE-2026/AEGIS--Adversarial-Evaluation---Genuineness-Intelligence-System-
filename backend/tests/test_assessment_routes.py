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

def _mock_query_result(result):
    query = MagicMock()
    query.filter.return_value.first.return_value = result
    query.options.return_value.filter.return_value.first.return_value = result
    return query


def test_save_candidate_response_creates_response(client, mock_db):
    mock_session = MagicMock()

    # query sequence: CandidateAssessment, CandidateResponse (None), AssessmentQuestion (None)
    mock_db.query.side_effect = [
        _mock_query_result(mock_session),
        _mock_query_result(None),
        _mock_query_result(None),
    ]

    # response_model expects response_id
    mock_db.refresh.side_effect = lambda obj: setattr(obj, "response_id", 101)

    response = client.post(
        "/api/v1/candidate-assessments/9/responses",
        json={
            "assessment_question_id": 11,
            "candidate_answer": "Draft answer",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["response_id"] == 101
    assert body["candidate_assessment_id"] == 9
    assert body["assessment_question_id"] == 11
    assert body["candidate_answer"] == "Draft answer"
    assert body["score"] is None
    assert body["is_correct"] is None


def test_save_candidate_response_updates_existing_response(client, mock_db):
    mock_session = MagicMock()

    existing_response = MagicMock()
    existing_response.response_id = 202
    existing_response.candidate_assessment_id = 9
    existing_response.assessment_question_id = 11
    existing_response.candidate_answer = "Old answer"
    existing_response.score = 3.5
    existing_response.is_correct = "PARTIAL"

    # query sequence: CandidateAssessment, CandidateResponse (existing), AssessmentQuestion (None)
    mock_db.query.side_effect = [
        _mock_query_result(mock_session),
        _mock_query_result(existing_response),
        _mock_query_result(None),
    ]

    response = client.post(
        "/api/v1/candidate-assessments/9/responses",
        json={
            "assessment_question_id": 11,
            "candidate_answer": "Updated answer",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["response_id"] == 202
    assert body["candidate_answer"] == "Updated answer"
    # grading skipped (assessment_question None), so service sets these to None
    assert body["score"] is None
    assert body["is_correct"] is None


def test_save_candidate_response_grades_json_correct_answer(client, mock_db):
    mock_session = MagicMock()

    mock_qb = MagicMock()
    mock_qb.correct_answer = {"answer": "b"}
    mock_qb.maximum_score = 4.0

    mock_aq = MagicMock()
    mock_aq.question_bank = mock_qb

    # query sequence: CandidateAssessment, CandidateResponse (None), AssessmentQuestion (with qb)
    mock_db.query.side_effect = [
        _mock_query_result(mock_session),
        _mock_query_result(None),
        _mock_query_result(mock_aq),
    ]

    mock_db.refresh.side_effect = lambda obj: setattr(obj, "response_id", 303)

    response = client.post(
        "/api/v1/candidate-assessments/9/responses",
        json={
            "assessment_question_id": 11,
            "candidate_answer": "b",
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["response_id"] == 303
    assert body["score"] == 4.0
    assert body["is_correct"] == "CORRECT"


def test_save_candidate_response_returns_404_for_missing_session(client, mock_db):
    # CandidateAssessment not found
    mock_db.query.side_effect = [_mock_query_result(None)]

    response = client.post(
        "/api/v1/candidate-assessments/999/responses",
        json={
            "assessment_question_id": 11,
            "candidate_answer": "anything",
        },
    )

    assert response.status_code == 404
    assert response.json()["detail"] == "Candidate assessment not found"