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


@pytest.fixture
def recruiter_client(mock_db):
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: {
        "user_id": "5",
        "role": "RECRUITER",
    }
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
    mock_a.status = "Draft"
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


def test_list_assessments_response_includes_status(client, mock_db):
    mock_a = MagicMock()
    mock_a.assessment_id = 1
    mock_a.title = "Test Assessment"
    mock_a.description = "A description"
    mock_a.duration_mins = 60
    mock_a.status = "Active"
    mock_a.created_at = datetime(2025, 1, 1)

    _setup_list(mock_db, [mock_a])
    response = client.get("/api/v1/assessments/")

    assert response.status_code == 200
    assert response.json()[0]["status"] == "Active"


_LIST_PATCH = "app.api.routes.assessment.get_all_assessments"


def test_list_assessments_passes_query_params_to_service(client, mock_db):
    with patch(_LIST_PATCH, return_value=[]) as mock_get_all:
        response = client.get(
            "/api/v1/assessments/",
            params={
                "search": "python",
                "status": "Draft",
                "limit": 10,
                "offset": 5,
            },
        )
    assert response.status_code == 200
    mock_get_all.assert_called_once_with(mock_db, "python", "Draft", 10, 5)


def test_list_assessments_defaults_filters_to_none(client, mock_db):
    with patch(_LIST_PATCH, return_value=[]) as mock_get_all:
        response = client.get("/api/v1/assessments/")
    assert response.status_code == 200
    mock_get_all.assert_called_once_with(mock_db, None, None, None, None)


def test_get_assessment_returns_200_with_correct_data(
    auth_client, mock_db
):
    mock_a = MagicMock()
    mock_a.assessment_id = 42
    mock_a.title = "Python Basics"
    mock_a.description = "Fundamentals test"
    mock_a.duration_mins = 45
    mock_a.created_at = datetime(2025, 6, 1)
    mock_a.assessment_questions = []

    _setup_by_id(mock_db, mock_a)
    response = auth_client.get("/api/v1/assessments/42")

    assert response.status_code == 200
    body = response.json()
    assert body["assessment_id"] == 42
    assert body["title"] == "Python Basics"


def test_get_assessment_returns_404_when_not_found(auth_client, mock_db):
    _setup_by_id(mock_db, None)
    response = auth_client.get("/api/v1/assessments/999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Assessment not found"


def test_get_assessment_returns_401_without_jwt(client, mock_db):
    _setup_by_id(mock_db, MagicMock())
    response = client.get("/api/v1/assessments/42")
    assert response.status_code == 401

def test_get_assessment_includes_questions_list(auth_client, mock_db):
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
    mock_aq.adv_question_id = 99
    mock_aq.question_bank = mock_qb

    mock_a = MagicMock()
    mock_a.assessment_id = 1
    mock_a.title = "Test"
    mock_a.description = None
    mock_a.duration_mins = 30
    mock_a.created_at = datetime(2025, 1, 1)
    mock_a.assessment_questions = [mock_aq]

    _setup_by_id(mock_db, mock_a)
    response = auth_client.get("/api/v1/assessments/1")

    assert response.status_code == 200
    body = response.json()
    assert "questions" in body
    assert isinstance(body["questions"], list)
    assert len(body["questions"]) == 1
    q = body["questions"][0]
    assert q["assessment_q_id"] == 7
    assert q["adv_question_id"] == 99
    assert "question_bank_id" not in q
    assert q["title"] == "What is X?"
    assert q["type"] == "TEXT"

def _mock_query_result(result):
    query = MagicMock()
    query.filter.return_value.first.return_value = result
    query.options.return_value.filter.return_value.first.return_value = result
    query.filter.return_value.all.return_value = result
    return query


_SESSION_GUARD_PATCH = (
    "app.api.routes.assessment.get_candidate_assessment_session"
)


def test_save_candidate_response_creates_response(auth_client, mock_db):
    mock_session = MagicMock()

    # query sequence: CandidateAssessment, CandidateResponse (None), AssessmentQuestion (None)
    mock_db.query.side_effect = [
        _mock_query_result(mock_session),
        _mock_query_result(None),
        _mock_query_result(None),
    ]

    # response_model expects response_id
    mock_db.refresh.side_effect = lambda obj: setattr(obj, "response_id", 101)

    with patch(_SESSION_GUARD_PATCH, return_value=MagicMock()):
        response = auth_client.post(
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


def test_save_candidate_response_updates_existing_response(
    auth_client, mock_db,
):
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

    with patch(_SESSION_GUARD_PATCH, return_value=MagicMock()):
        response = auth_client.post(
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


def test_save_candidate_response_grades_json_correct_answer(
    auth_client, mock_db,
):
    mock_session = MagicMock()

    mock_qb = MagicMock()
    mock_qb.correct_answer = {"answer": "b"}
    mock_qb.maximum_score = 4.0

    mock_aq = MagicMock()
    mock_aq.adversarial_question.source_question = mock_qb

    # query sequence: CandidateAssessment, CandidateResponse (None), AssessmentQuestion (with qb)
    mock_db.query.side_effect = [
        _mock_query_result(mock_session),
        _mock_query_result(None),
        _mock_query_result(mock_aq),
    ]

    mock_db.refresh.side_effect = lambda obj: setattr(obj, "response_id", 303)

    with patch(_SESSION_GUARD_PATCH, return_value=MagicMock()):
        response = auth_client.post(
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


def test_save_candidate_response_returns_404_for_missing_session(
    auth_client, mock_db,
):
    # CandidateAssessment not found
    mock_db.query.side_effect = [_mock_query_result(None)]

    with patch(_SESSION_GUARD_PATCH, return_value=MagicMock()):
        response = auth_client.post(
            "/api/v1/candidate-assessments/999/responses",
            json={
                "assessment_question_id": 11,
                "candidate_answer": "anything",
            },
        )

    assert response.status_code == 404
    assert response.json()["detail"] == "Candidate assessment not found"


def test_save_candidate_response_returns_401_without_jwt(client, mock_db):
    response = client.post(
        "/api/v1/candidate-assessments/9/responses",
        json={
            "assessment_question_id": 11,
            "candidate_answer": "Draft answer",
        },
    )

    assert response.status_code == 401


def test_save_candidate_response_returns_403_for_wrong_candidate(
    auth_client, mock_db,
):
    with patch(
        _SESSION_GUARD_PATCH,
        side_effect=HTTPException(status_code=403, detail="Invalid token"),
    ):
        response = auth_client.post(
            "/api/v1/candidate-assessments/9/responses",
            json={
                "assessment_question_id": 11,
                "candidate_answer": "Draft answer",
            },
        )

    assert response.status_code == 403
    assert response.json()["detail"] == "Invalid token"


def test_submit_candidate_assessment_updates_scores(auth_client, mock_db):
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

    # query sequence: CandidateAssessment, CandidateResponseMetrics
    mock_db.query.side_effect = [
        _mock_query_result(mock_session),
        _mock_query_result([]),
    ]

    with patch(_SESSION_GUARD_PATCH, return_value=MagicMock()):
        response = auth_client.post(
            "/api/v1/candidate-assessments/9/submit",
        )

    assert response.status_code == 200
    body = response.json()
    assert body["candidate_assess_id"] == 9
    assert body["total_score"] == 8.0
    assert body["status"] == "COMPLETED"


def test_submit_candidate_assessment_returns_401_without_jwt(client, mock_db):
    response = client.post("/api/v1/candidate-assessments/9/submit")

    assert response.status_code == 401


def test_submit_candidate_assessment_returns_403_for_wrong_candidate(
    auth_client, mock_db,
):
    with patch(
        _SESSION_GUARD_PATCH,
        side_effect=HTTPException(status_code=403, detail="Invalid token"),
    ):
        response = auth_client.post("/api/v1/candidate-assessments/9/submit")

    assert response.status_code == 403


def test_list_candidate_responses_returns_responses(auth_client, mock_db):
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

    with patch(_SESSION_GUARD_PATCH, return_value=MagicMock()):
        response = auth_client.get(
            "/api/v1/candidate-assessments/9/responses"
        )

    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert len(body) == 2
    assert body[0]["response_id"] == 1
    assert body[0]["candidate_answer"] == "A"
    assert body[1]["response_id"] == 2
    assert body[1]["candidate_answer"] == "B"


def test_list_candidate_responses_returns_404_for_missing_session(
    auth_client, mock_db,
):
    mock_db.query.side_effect = [_mock_query_result(None)]

    with patch(_SESSION_GUARD_PATCH, return_value=MagicMock()):
        response = auth_client.get(
            "/api/v1/candidate-assessments/999/responses"
        )

    assert response.status_code == 404
    assert response.json()["detail"] == "Candidate assessment not found"


def test_list_candidate_responses_returns_401_without_jwt(client, mock_db):
    response = client.get("/api/v1/candidate-assessments/9/responses")

    assert response.status_code == 401


def test_list_candidate_responses_returns_403_for_wrong_candidate(
    auth_client, mock_db,
):
    with patch(
        _SESSION_GUARD_PATCH,
        side_effect=HTTPException(status_code=403, detail="Invalid token"),
    ):
        response = auth_client.get(
            "/api/v1/candidate-assessments/9/responses"
        )

    assert response.status_code == 403


_EXECUTE_CODE_PATCH = "app.api.routes.assessment.execute_candidate_code"


def _execute_payload():
    return {
        "candidate_assessment_id": 9,
        "assessment_question_id": 11,
        "code": "print(1)",
    }


def test_execute_code_returns_401_without_jwt(client, mock_db):
    response = client.post(
        "/api/v1/assessments/execute", json=_execute_payload(),
    )

    assert response.status_code == 401


def test_execute_code_returns_403_for_wrong_candidate(auth_client, mock_db):
    with patch(
        _SESSION_GUARD_PATCH,
        side_effect=HTTPException(status_code=403, detail="Invalid token"),
    ):
        response = auth_client.post(
            "/api/v1/assessments/execute", json=_execute_payload(),
        )

    assert response.status_code == 403


def test_execute_code_returns_200_for_owning_candidate(auth_client, mock_db):
    exec_result = {
        "score": 100.0,
        "is_correct": True,
        "test_cases_passed": 1,
        "test_cases_failed": 0,
        "test_cases_total": 1,
        "results": [],
    }
    with patch(_SESSION_GUARD_PATCH, return_value=MagicMock()), \
         patch(_EXECUTE_CODE_PATCH, return_value=exec_result) as mock_exec:
        response = auth_client.post(
            "/api/v1/assessments/execute", json=_execute_payload(),
        )

    assert response.status_code == 200
    assert response.json()["score"] == 100.0
    mock_exec.assert_called_once()


_INVITE_PATCH = "app.api.routes.assessment.create_candidate_assessment"
_GET_ASSESSMENT_PATCH = "app.api.routes.assessment.get_assessment_by_id"


def _make_mock_session(assessment_id=1, candidate_id=2):
    token = str(uuid.uuid4())
    mock_session = MagicMock()
    mock_session.candidate_assess_id = 10
    mock_session.access_token = token
    mock_session.status = SessionStatus.STARTED
    mock_session.assessment_id = assessment_id
    mock_session.candidate_id = candidate_id
    return mock_session


def _make_owned_assessment(creator_id=5):
    assessment = MagicMock()
    assessment.creator_id = creator_id
    return assessment


def test_invite_candidate_returns_201(recruiter_client, mock_db):
    mock_session = _make_mock_session()
    with patch(
        _GET_ASSESSMENT_PATCH, return_value=_make_owned_assessment(),
    ), patch(_INVITE_PATCH, return_value=mock_session):
        response = recruiter_client.post(
            "/api/v1/assessments/1/invite",
            json={"candidate_id": 2},
        )
    assert response.status_code == 201


def test_invite_candidate_response_includes_access_link(
    recruiter_client, mock_db,
):
    mock_session = _make_mock_session()
    with patch(
        _GET_ASSESSMENT_PATCH, return_value=_make_owned_assessment(),
    ), patch(_INVITE_PATCH, return_value=mock_session):
        response = recruiter_client.post(
            "/api/v1/assessments/1/invite",
            json={"candidate_id": 2},
        )
    body = response.json()
    assert "access_link" in body
    assert mock_session.access_token in body["access_link"]
    assert body["access_link"].startswith("http://localhost:3000/assessment/take?token=")


def test_invite_candidate_response_fields(recruiter_client, mock_db):
    mock_session = _make_mock_session(assessment_id=1, candidate_id=2)
    with patch(
        _GET_ASSESSMENT_PATCH, return_value=_make_owned_assessment(),
    ), patch(_INVITE_PATCH, return_value=mock_session):
        response = recruiter_client.post(
            "/api/v1/assessments/1/invite",
            json={"candidate_id": 2},
        )
    body = response.json()
    assert body["candidate_assess_id"] == 10
    assert body["assessment_id"] == 1
    assert body["candidate_id"] == 2
    assert body["status"] == "STARTED"
    assert body["access_token"] == mock_session.access_token


def test_invite_candidate_returns_401_without_jwt(client, mock_db):
    response = client.post(
        "/api/v1/assessments/1/invite",
        json={"candidate_id": 2},
    )
    assert response.status_code == 401


def test_invite_candidate_returns_403_for_non_recruiter(auth_client, mock_db):
    response = auth_client.post(
        "/api/v1/assessments/1/invite",
        json={"candidate_id": 2},
    )
    assert response.status_code == 403
    assert response.json()["detail"] == (
        "Only recruiters can invite candidates."
    )


def test_invite_candidate_returns_403_for_wrong_recruiter(
    recruiter_client, mock_db,
):
    with patch(
        _GET_ASSESSMENT_PATCH,
        return_value=_make_owned_assessment(creator_id=999),
    ), patch(_INVITE_PATCH) as mock_invite:
        response = recruiter_client.post(
            "/api/v1/assessments/1/invite",
            json={"candidate_id": 2},
        )
    assert response.status_code == 403
    assert "assessments you created" in response.json()["detail"]
    mock_invite.assert_not_called()


def test_invite_candidate_returns_404_when_assessment_not_found(
    recruiter_client, mock_db,
):
    with patch(_GET_ASSESSMENT_PATCH, return_value=None), \
         patch(_INVITE_PATCH) as mock_invite:
        response = recruiter_client.post(
            "/api/v1/assessments/999/invite",
            json={"candidate_id": 1},
        )
    assert response.status_code == 404
    assert response.json()["detail"] == "Assessment not found"
    mock_invite.assert_not_called()


def test_invite_candidate_returns_404_when_candidate_not_found(
    recruiter_client, mock_db,
):
    exc = HTTPException(status_code=404, detail="Candidate not found")
    with patch(
        _GET_ASSESSMENT_PATCH, return_value=_make_owned_assessment(),
    ), patch(_INVITE_PATCH, side_effect=exc):
        response = recruiter_client.post(
            "/api/v1/assessments/1/invite",
            json={"candidate_id": 999},
        )
    assert response.status_code == 404
    assert response.json()["detail"] == "Candidate not found"


def test_invite_candidate_returns_400_when_already_invited(
    recruiter_client, mock_db,
):
    with patch(
        _GET_ASSESSMENT_PATCH, return_value=_make_owned_assessment(),
    ), patch(
        _INVITE_PATCH,
        side_effect=HTTPException(
            status_code=400,
            detail="Candidate has already been invited to this assessment",
        ),
    ):
        response = recruiter_client.post(
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


QUESTIONS_PATCH = "app.api.routes.assessment.get_questions_for_candidate_assessment"


def _make_mock_question(assessment_q_id=1, display_order=1, marks=5.0):
    mock_qb = MagicMock()
    mock_qb.question_bank_id = 10
    mock_qb.title = "What is X?"
    mock_qb.content = "Explain X."
    mock_qb.type.value = "TEXT"
    mock_qb.maximum_score = 5.0
    mock_qb.tags = ["python"]
    mock_qb.question_metadata = {"difficulty": "easy"}

    mock_aq = MagicMock()
    mock_aq.assessment_q_id = assessment_q_id
    mock_aq.display_order = display_order
    mock_aq.marks = marks
    mock_aq.question_bank = mock_qb
    return mock_aq


def test_get_candidate_questions_returns_200_with_list(auth_client, mock_db):
    mock_aq = _make_mock_question()
    with patch(QUESTIONS_PATCH, return_value=[mock_aq]):
        response = auth_client.get("/api/v1/assessments/candidate/1/questions")
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert len(body) == 1
    assert body[0]["assessment_q_id"] == 1


def test_get_candidate_questions_returns_404_when_session_not_found(
    auth_client, mock_db
):
    exc = HTTPException(status_code=404, detail="Assessment session not found")
    with patch(QUESTIONS_PATCH, side_effect=exc):
        response = auth_client.get("/api/v1/assessments/candidate/99/questions")
    assert response.status_code == 404
    assert response.json()["detail"] == "Assessment session not found"


def test_get_candidate_questions_returns_403_when_wrong_user(auth_client, mock_db):
    exc = HTTPException(
        status_code=403,
        detail="You are not authorised to access this assessment",
    )
    with patch(QUESTIONS_PATCH, side_effect=exc):
        response = auth_client.get("/api/v1/assessments/candidate/1/questions")
    assert response.status_code == 403
    assert response.json()["detail"] == "You are not authorised to access this assessment"


def test_get_candidate_questions_returns_401_when_no_jwt(client, mock_db):
    response = client.get("/api/v1/assessments/candidate/1/questions")
    assert response.status_code == 401


def test_get_candidate_questions_includes_question_metadata(auth_client, mock_db):
    mock_aq = _make_mock_question()
    with patch(QUESTIONS_PATCH, return_value=[mock_aq]):
        response = auth_client.get("/api/v1/assessments/candidate/1/questions")
    body = response.json()
    assert "question" in body[0]
    assert "question_metadata" in body[0]["question"]
    assert body[0]["question"]["question_metadata"] == {"difficulty": "easy"}

_CREATE_PATCH = "app.api.routes.assessment.create_assessment"

def _make_mock_created_assessment():
    mock_a = MagicMock()
    mock_a.assessment_id = 10
    mock_a.title = "New Assessment"
    mock_a.description = "A description"
    mock_a.duration_mins = 60
    mock_a.creator_id = 5
    mock_a.status = "Draft"
    mock_a.created_at = datetime(2025, 1, 1)
    return mock_a


def test_create_assessment_returns_201(recruiter_client, mock_db):
    mock_a = _make_mock_created_assessment()
    with patch(_CREATE_PATCH, return_value=mock_a):
        response = recruiter_client.post(
            "/api/v1/assessments/",
            json={"title": "New Assessment", "duration_mins": 60},
        )
    assert response.status_code == 201


def test_create_assessment_response_has_correct_fields(
    recruiter_client, mock_db
):
    mock_a = _make_mock_created_assessment()
    with patch(_CREATE_PATCH, return_value=mock_a):
        response = recruiter_client.post(
            "/api/v1/assessments/",
            json={"title": "New Assessment", "duration_mins": 60},
        )
    body = response.json()
    assert body["assessment_id"] == 10
    assert body["title"] == "New Assessment"
    assert body["duration_mins"] == 60
    assert body["creator_id"] == 5
    assert body["status"] == "Draft"


def test_create_assessment_response_includes_optional_description(
    recruiter_client, mock_db
):
    mock_a = _make_mock_created_assessment()
    with patch(_CREATE_PATCH, return_value=mock_a):
        response = recruiter_client.post(
            "/api/v1/assessments/",
            json={
                "title": "New Assessment",
                "description": "A description",
                "duration_mins": 60,
            },
        )
    assert response.json()["description"] == "A description"


def test_create_assessment_returns_401_without_jwt(client, mock_db):
    response = client.post(
        "/api/v1/assessments/",
        json={"title": "New Assessment", "duration_mins": 60},
    )
    assert response.status_code == 401


def test_create_assessment_returns_403_for_non_recruiter(
    auth_client, mock_db
):
    response = auth_client.post(
        "/api/v1/assessments/",
        json={"title": "New Assessment", "duration_mins": 60},
    )
    assert response.status_code == 403
    assert "Only recruiters" in response.json()["detail"]


def test_create_assessment_returns_422_when_title_missing(
    recruiter_client, mock_db
):
    response = recruiter_client.post(
        "/api/v1/assessments/",
        json={"duration_mins": 60},
    )
    assert response.status_code == 422


def test_create_assessment_returns_422_when_duration_missing(
    recruiter_client, mock_db
):
    response = recruiter_client.post(
        "/api/v1/assessments/",
        json={"title": "New Assessment"},
    )
    assert response.status_code == 422


_ADD_QUESTION_PATCH = (
    "app.api.routes.assessment.add_question_to_assessment"
)
_REMOVE_QUESTION_PATCH = (
    "app.api.routes.assessment.remove_question_from_assessment"
)


def _make_mock_assessment_question(
    assessment_q_id=1,
    assessments_id=2,
    adv_question_id=3,
    display_order=1,
    marks=5.0,
):
    mock_aq = MagicMock()
    mock_aq.assessment_q_id = assessment_q_id
    mock_aq.assessments_id = assessments_id
    mock_aq.adv_question_id = adv_question_id
    mock_aq.display_order = display_order
    mock_aq.marks = marks
    return mock_aq


def test_add_question_returns_401_without_jwt(client, mock_db):
    response = client.post(
        "/api/v1/assessments/2/questions",
        json={"adv_question_id": 3},
    )
    assert response.status_code == 401


def test_add_question_returns_403_for_non_recruiter(
    auth_client, mock_db
):
    response = auth_client.post(
        "/api/v1/assessments/2/questions",
        json={"adv_question_id": 3},
    )
    assert response.status_code == 403
    assert "Only recruiters" in response.json()["detail"]


def test_add_question_returns_404_when_assessment_not_found(
    recruiter_client, mock_db
):
    exc = HTTPException(status_code=404, detail="Assessment not found")
    with patch(_ADD_QUESTION_PATCH, side_effect=exc):
        response = recruiter_client.post(
            "/api/v1/assessments/2/questions",
            json={"adv_question_id": 3},
        )
    assert response.status_code == 404
    assert response.json()["detail"] == "Assessment not found"


def test_add_question_returns_404_when_adv_question_not_found(
    recruiter_client, mock_db
):
    exc = HTTPException(
        status_code=404, detail="Adversarial question not found"
    )
    with patch(_ADD_QUESTION_PATCH, side_effect=exc):
        response = recruiter_client.post(
            "/api/v1/assessments/2/questions",
            json={"adv_question_id": 3},
        )
    assert response.status_code == 404
    assert response.json()["detail"] == (
        "Adversarial question not found"
    )


def test_add_question_returns_409_when_already_linked(
    recruiter_client, mock_db
):
    exc = HTTPException(
        status_code=409,
        detail="This question is already linked to this assessment",
    )
    with patch(_ADD_QUESTION_PATCH, side_effect=exc):
        response = recruiter_client.post(
            "/api/v1/assessments/2/questions",
            json={"adv_question_id": 3},
        )
    assert response.status_code == 409
    assert "already linked" in response.json()["detail"]


def test_add_question_returns_201_with_correct_body(
    recruiter_client, mock_db
):
    mock_aq = _make_mock_assessment_question()
    with patch(_ADD_QUESTION_PATCH, return_value=mock_aq):
        response = recruiter_client.post(
            "/api/v1/assessments/2/questions",
            json={
                "adv_question_id": 3,
                "display_order": 1,
                "marks": 5.0,
            },
        )
    assert response.status_code == 201
    body = response.json()
    assert body["assessment_q_id"] == 1
    assert body["assessments_id"] == 2
    assert body["adv_question_id"] == 3
    assert body["display_order"] == 1
    assert body["marks"] == pytest.approx(5.0)


def test_remove_question_returns_401_without_jwt(client, mock_db):
    response = client.delete("/api/v1/assessments/2/questions/3")
    assert response.status_code == 401


def test_remove_question_returns_403_for_non_recruiter(
    auth_client, mock_db
):
    response = auth_client.delete("/api/v1/assessments/2/questions/3")
    assert response.status_code == 403
    assert "Only recruiters" in response.json()["detail"]


def test_remove_question_returns_404_when_assessment_not_found(
    recruiter_client, mock_db
):
    exc = HTTPException(status_code=404, detail="Assessment not found")
    with patch(_REMOVE_QUESTION_PATCH, side_effect=exc):
        response = recruiter_client.delete(
            "/api/v1/assessments/2/questions/3"
        )
    assert response.status_code == 404
    assert response.json()["detail"] == "Assessment not found"


def test_remove_question_returns_404_when_link_not_found(
    recruiter_client, mock_db
):
    exc = HTTPException(
        status_code=404,
        detail="Question is not linked to this assessment",
    )
    with patch(_REMOVE_QUESTION_PATCH, side_effect=exc):
        response = recruiter_client.delete(
            "/api/v1/assessments/2/questions/3"
        )
    assert response.status_code == 404
    assert response.json()["detail"] == (
        "Question is not linked to this assessment"
    )


def test_remove_question_returns_204_with_no_body(
    recruiter_client, mock_db
):
    with patch(_REMOVE_QUESTION_PATCH, return_value=None):
        response = recruiter_client.delete(
            "/api/v1/assessments/2/questions/3"
        )
    assert response.status_code == 204
    assert response.content == b""


_UPDATE_PATCH = "app.api.routes.assessment.update_assessment"
_ACTIVATE_PATCH = "app.api.routes.assessment.activate_assessment"


def _make_mock_updated_assessment():
    mock_a = MagicMock()
    mock_a.assessment_id = 10
    mock_a.title = "Updated Title"
    mock_a.description = "Updated description"
    mock_a.duration_mins = 90
    mock_a.creator_id = 5
    mock_a.status = "Draft"
    mock_a.created_at = datetime(2025, 1, 1)
    return mock_a


def test_update_assessment_returns_200(recruiter_client, mock_db):
    mock_a = _make_mock_updated_assessment()
    with patch(_UPDATE_PATCH, return_value=mock_a):
        response = recruiter_client.patch(
            "/api/v1/assessments/10",
            json={"title": "Updated Title"},
        )
    assert response.status_code == 200


def test_update_assessment_response_has_correct_fields(
    recruiter_client, mock_db
):
    mock_a = _make_mock_updated_assessment()
    with patch(_UPDATE_PATCH, return_value=mock_a):
        response = recruiter_client.patch(
            "/api/v1/assessments/10",
            json={"title": "Updated Title"},
        )
    body = response.json()
    assert body["assessment_id"] == 10
    assert body["title"] == "Updated Title"
    assert body["duration_mins"] == 90
    assert body["creator_id"] == 5
    assert body["status"] == "Draft"


def test_update_assessment_returns_401_without_jwt(client, mock_db):
    response = client.patch(
        "/api/v1/assessments/10",
        json={"title": "Updated Title"},
    )
    assert response.status_code == 401


def test_update_assessment_returns_403_for_non_recruiter(
    auth_client, mock_db
):
    response = auth_client.patch(
        "/api/v1/assessments/10",
        json={"title": "Updated Title"},
    )
    assert response.status_code == 403
    assert "Only recruiters" in response.json()["detail"]


def test_update_assessment_returns_404_when_not_found(
    recruiter_client, mock_db
):
    exc = HTTPException(status_code=404, detail="Assessment not found")
    with patch(_UPDATE_PATCH, side_effect=exc):
        response = recruiter_client.patch(
            "/api/v1/assessments/999",
            json={"title": "Updated Title"},
        )
    assert response.status_code == 404
    assert response.json()["detail"] == "Assessment not found"


def test_update_assessment_returns_422_for_invalid_duration(
    recruiter_client, mock_db
):
    response = recruiter_client.patch(
        "/api/v1/assessments/10",
        json={"duration_mins": 0},
    )
    assert response.status_code == 422


def test_update_assessment_passes_only_provided_fields(
    recruiter_client, mock_db
):
    mock_a = _make_mock_updated_assessment()
    with patch(_UPDATE_PATCH, return_value=mock_a) as mock_update:
        recruiter_client.patch(
            "/api/v1/assessments/10",
            json={"title": "Updated Title"},
        )
    mock_update.assert_called_once_with(
        mock_db, 10, "Updated Title", None, None
    )


def test_activate_assessment_returns_200(recruiter_client, mock_db):
    mock_a = _make_mock_updated_assessment()
    mock_a.status = "Active"
    with patch(_ACTIVATE_PATCH, return_value=mock_a):
        response = recruiter_client.post(
            "/api/v1/assessments/10/activate"
        )
    assert response.status_code == 200
    assert response.json()["status"] == "Active"


def test_activate_assessment_returns_401_without_jwt(client, mock_db):
    response = client.post("/api/v1/assessments/10/activate")
    assert response.status_code == 401


def test_activate_assessment_returns_403_for_non_recruiter(
    auth_client, mock_db
):
    response = auth_client.post("/api/v1/assessments/10/activate")
    assert response.status_code == 403
    assert "Only recruiters" in response.json()["detail"]


def test_activate_assessment_returns_404_when_not_found(
    recruiter_client, mock_db
):
    exc = HTTPException(status_code=404, detail="Assessment not found")
    with patch(_ACTIVATE_PATCH, side_effect=exc):
        response = recruiter_client.post(
            "/api/v1/assessments/999/activate"
        )
    assert response.status_code == 404
    assert response.json()["detail"] == "Assessment not found"


def test_activate_assessment_returns_400_when_not_draft(
    recruiter_client, mock_db
):
    exc = HTTPException(
        status_code=400,
        detail="Only draft assessments can be activated",
    )
    with patch(_ACTIVATE_PATCH, side_effect=exc):
        response = recruiter_client.post(
            "/api/v1/assessments/10/activate"
        )
    assert response.status_code == 400
