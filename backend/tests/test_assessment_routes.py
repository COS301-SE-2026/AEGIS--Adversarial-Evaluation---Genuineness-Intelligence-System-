import os
import uuid
from datetime import datetime
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
from fastapi import HTTPException
from fastapi.testclient import TestClient

from app.main import app
from app.database.database import get_db
from app.core.security import get_current_user
from app.models.candidate_assessment import SessionStatus


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
    query.filter.return_value.all.return_value = result
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


def test_submit_candidate_assessment_updates_scores(client, mock_db):
    mock_session = MagicMock()
    mock_session.candidate_assess_id = 9
    mock_session.access_token = "token-123"
    mock_session.status = "COMPLETED"

    mock_resp_1 = MagicMock()
    mock_resp_1.score = 2.0
    mock_resp_2 = MagicMock()
    mock_resp_2.score = None
    mock_session.responses = [mock_resp_1, mock_resp_2]

    mock_qb = MagicMock()
    mock_qb.maximum_score = 5.0
    mock_aq_1 = MagicMock()
    mock_aq_1.marks = None
    mock_aq_1.question_bank = mock_qb

    mock_aq_2 = MagicMock()
    mock_aq_2.marks = 3.0
    mock_aq_2.question_bank = None

    mock_assessment = MagicMock()
    mock_assessment.assessment_questions = [mock_aq_1, mock_aq_2]
    mock_session.assessment = mock_assessment

    mock_db.query.side_effect = [
        _mock_query_result(mock_session),
    ]

    response = client.post(
        "/api/v1/candidate-assessments/9/submit",
    )

    assert response.status_code == 200
    body = response.json()
    assert body["candidate_assess_id"] == 9
    assert body["total_score"] == 8.0
    assert body["status"] == "COMPLETED"


def test_list_candidate_responses_returns_responses(client, mock_db):
    mock_session = MagicMock()

    response_one = MagicMock()
    response_one.response_id = 1
    response_one.candidate_assessment_id = 9
    response_one.assessment_question_id = 11
    response_one.candidate_answer = "A"
    response_one.score = 1.0
    response_one.is_correct = "CORRECT"

    response_two = MagicMock()
    response_two.response_id = 2
    response_two.candidate_assessment_id = 9
    response_two.assessment_question_id = 12
    response_two.candidate_answer = "B"
    response_two.score = 0.0
    response_two.is_correct = "INCORRECT"

    mock_db.query.side_effect = [
        _mock_query_result(mock_session),
        _mock_query_result([response_one, response_two]),
    ]

    response = client.get("/api/v1/candidate-assessments/9/responses")

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert len(body) == 2
    assert body[0]["response_id"] == 1
    assert body[0]["candidate_answer"] == "A"
    assert body[1]["response_id"] == 2
    assert body[1]["candidate_answer"] == "B"


def test_list_candidate_responses_returns_404_for_missing_session(client, mock_db):
    mock_db.query.side_effect = [_mock_query_result(None)]

    response = client.get("/api/v1/candidate-assessments/999/responses")

    assert response.status_code == 404
    assert response.json()["detail"] == "Candidate assessment not found"

_INVITE_PATCH = "app.api.routes.assessment.create_candidate_assessment"


def _make_mock_session(assessment_id=1, candidate_id=2):
    token = str(uuid.uuid4())
    mock_session = MagicMock()
    mock_session.candidate_assess_id = 10
    mock_session.access_token = token
    mock_session.status = SessionStatus.STARTED
    mock_session.assessment_id = assessment_id
    mock_session.candidate_id = candidate_id
    return mock_session


def test_invite_candidate_returns_201(client, mock_db):
    mock_session = _make_mock_session()
    with patch(_INVITE_PATCH, return_value=mock_session):
        response = client.post(
            "/api/v1/assessments/1/invite",
            json={"candidate_id": 2},
        )
    assert response.status_code == 201


def test_invite_candidate_response_includes_access_link(client, mock_db):
    mock_session = _make_mock_session()
    with patch(_INVITE_PATCH, return_value=mock_session):
        response = client.post(
            "/api/v1/assessments/1/invite",
            json={"candidate_id": 2},
        )
    body = response.json()
    assert "access_link" in body
    assert mock_session.access_token in body["access_link"]
    assert body["access_link"].startswith("http://localhost:3000/assessment/take?token=")


def test_invite_candidate_response_fields(client, mock_db):
    mock_session = _make_mock_session(assessment_id=1, candidate_id=2)
    with patch(_INVITE_PATCH, return_value=mock_session):
        response = client.post(
            "/api/v1/assessments/1/invite",
            json={"candidate_id": 2},
        )
    body = response.json()
    assert body["candidate_assess_id"] == 10
    assert body["assessment_id"] == 1
    assert body["candidate_id"] == 2
    assert body["status"] == "STARTED"
    assert body["access_token"] == mock_session.access_token


def test_invite_candidate_returns_404_when_assessment_not_found(client, mock_db):
    exc = HTTPException(status_code=404, detail="Assessment not found")
    with patch(_INVITE_PATCH, side_effect=exc):
        response = client.post(
            "/api/v1/assessments/999/invite",
            json={"candidate_id": 1},
        )
    assert response.status_code == 404
    assert response.json()["detail"] == "Assessment not found"


def test_invite_candidate_returns_404_when_candidate_not_found(client, mock_db):
    exc = HTTPException(status_code=404, detail="Candidate not found")
    with patch(_INVITE_PATCH, side_effect=exc):
        response = client.post(
            "/api/v1/assessments/1/invite",
            json={"candidate_id": 999},
        )
    assert response.status_code == 404
    assert response.json()["detail"] == "Candidate not found"


def test_invite_candidate_returns_400_when_already_invited(client, mock_db):
    with patch(
        _INVITE_PATCH,
        side_effect=HTTPException(
            status_code=400,
            detail="Candidate has already been invited to this assessment",
        ),
    ):
        response = client.post(
            "/api/v1/assessments/1/invite",
            json={"candidate_id": 2},
        )
    assert response.status_code == 400
    assert "already been invited" in response.json()["detail"]


START_PATCH = "app.api.routes.assessment.start_candidate_assessment"


def _make_started_session(access_token="valid-token"):
    mock_session = MagicMock()
    mock_session.candidate_assess_id = 5
    mock_session.status = SessionStatus.IN_PROGRESS
    mock_session.assessment_id = 1
    mock_session.candidate_id = 2
    mock_session.access_token = access_token
    mock_session.start_time = datetime(2025, 1, 1, 12, 0, 0)
    mock_session.end_time = datetime(2025, 1, 1, 13, 0, 0)
    return mock_session


def test_start_assessment_returns_200_on_valid_token(client, mock_db):
    mock_session = _make_started_session()
    with patch(START_PATCH, return_value=mock_session):
        response = client.post("/api/v1/assessments/take/valid-token/start")
    assert response.status_code == 200


def test_start_assessment_response_includes_start_time_and_end_time(client, mock_db):
    mock_session = _make_started_session()
    with patch(START_PATCH, return_value=mock_session):
        response = client.post("/api/v1/assessments/take/valid-token/start")
    body = response.json()
    assert "start_time" in body
    assert "end_time" in body
    assert body["start_time"] is not None
    assert body["end_time"] is not None


def test_start_assessment_returns_404_on_invalid_token(client, mock_db):
    exc = HTTPException(status_code=404, detail="Invalid access token")
    with patch(START_PATCH, side_effect=exc):
        response = client.post("/api/v1/assessments/take/bad-token/start")
    assert response.status_code == 404
    assert response.json()["detail"] == "Invalid access token"


def test_start_assessment_returns_400_when_already_in_progress(client, mock_db):
    exc = HTTPException(
        status_code=400, detail="Assessment has already been started"
    )
    with patch(START_PATCH, side_effect=exc):
        response = client.post("/api/v1/assessments/take/some-token/start")
    assert response.status_code == 400
    assert response.json()["detail"] == "Assessment has already been started"


def test_start_assessment_returns_400_when_already_completed(client, mock_db):
    exc = HTTPException(
        status_code=400, detail="Assessment has already been completed"
    )
    with patch(START_PATCH, side_effect=exc):
        response = client.post("/api/v1/assessments/take/some-token/start")
    assert response.status_code == 400
    assert response.json()["detail"] == "Assessment has already been completed"


def test_start_assessment_returns_400_when_expired(client, mock_db):
    exc = HTTPException(status_code=400, detail="Assessment has expired")
    with patch(START_PATCH, side_effect=exc):
        response = client.post("/api/v1/assessments/take/some-token/start")
    assert response.status_code == 400
    assert response.json()["detail"] == "Assessment has expired"


MY_ASSESSMENTS_PATCH = "app.api.routes.assessment.get_candidate_assessments"


def _make_my_assessment_session():
    mock_assessment = MagicMock()
    mock_assessment.assessment_id = 10
    mock_assessment.title = "Python Test"
    mock_assessment.description = "Fundamentals"
    mock_assessment.duration_mins = 30

    mock_session = MagicMock()
    mock_session.candidate_assess_id = 1
    mock_session.status = SessionStatus.IN_PROGRESS
    mock_session.access_token = "tok-abc"
    mock_session.start_time = datetime(2025, 1, 1, 9, 0, 0)
    mock_session.end_time = datetime(2025, 1, 1, 9, 30, 0)
    mock_session.assessment = mock_assessment
    return mock_session


def test_my_assessments_returns_200_with_list(auth_client, mock_db):
    mock_session = _make_my_assessment_session()
    with patch(MY_ASSESSMENTS_PATCH, return_value=[mock_session]):
        response = auth_client.get("/api/v1/assessments/my-assessments")
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert len(body) == 1
    assert body[0]["candidate_assess_id"] == 1


def test_my_assessments_returns_200_empty_list(auth_client, mock_db):
    with patch(MY_ASSESSMENTS_PATCH, return_value=[]):
        response = auth_client.get("/api/v1/assessments/my-assessments")
    assert response.status_code == 200
    assert response.json() == []


def test_my_assessments_returns_401_without_jwt(client, mock_db):
    response = client.get("/api/v1/assessments/my-assessments")
    assert response.status_code == 401


def test_my_assessments_returns_nested_assessment_details(auth_client, mock_db):
    mock_session = _make_my_assessment_session()
    with patch(MY_ASSESSMENTS_PATCH, return_value=[mock_session]):
        response = auth_client.get("/api/v1/assessments/my-assessments")
    body = response.json()
    item = body[0]
    assert "assessment" in item
    assert item["assessment"]["assessment_id"] == 10
    assert item["assessment"]["title"] == "Python Test"
    assert item["assessment"]["description"] == "Fundamentals"
    assert item["assessment"]["duration_mins"] == 30
    assert item["status"] == "IN_PROGRESS"
    assert item["access_token"] == "tok-abc"
