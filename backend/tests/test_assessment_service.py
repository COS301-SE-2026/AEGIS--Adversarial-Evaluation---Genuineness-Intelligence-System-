import uuid
from datetime import datetime, timedelta
from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.models.assessment import Assessment
from app.models.candidate_assessment import CandidateAssessment, SessionStatus
from app.models.user import User
from app.services.assessment import (
    create_candidate_assessment,
    get_all_assessments,
    get_assessment_by_id,
    get_candidate_assessments,
    save_candidate_response,
    start_candidate_assessment,
)
from app.schema.candidate_response import ResponseCreate


def _make_mock_db_for_all(assessments):
    mock_db = MagicMock()
    mock_db.query.return_value.all.return_value = assessments
    return mock_db


def _make_mock_db_for_by_id(assessment):
    mock_db = MagicMock()
    (
        mock_db.query.return_value
        .options.return_value
        .filter.return_value
        .first.return_value
    ) = assessment
    return mock_db


def _mock_query_result(result):
    query = MagicMock()
    query.filter.return_value.first.return_value = result
    query.options.return_value.filter.return_value.first.return_value = result
    return query


def test_get_all_assessments_returns_list():
    mock_db = _make_mock_db_for_all([])
    result = get_all_assessments(mock_db)
    assert isinstance(result, list)


def test_get_all_assessments_returns_empty_list():
    mock_db = _make_mock_db_for_all([])
    result = get_all_assessments(mock_db)
    assert result == []


def test_get_all_assessments_items_have_required_fields():
    mock_a = MagicMock()
    mock_a.assessment_id = 1
    mock_a.title = "Test Assessment"
    mock_a.description = "A description"
    mock_a.duration_mins = 60
    mock_a.created_at = datetime(2025, 1, 1)

    mock_db = _make_mock_db_for_all([mock_a])
    result = get_all_assessments(mock_db)

    assert len(result) == 1
    item = result[0]
    assert item.assessment_id == 1
    assert item.title == "Test Assessment"
    assert item.description == "A description"
    assert item.duration_mins == 60
    assert item.created_at == datetime(2025, 1, 1)


def test_get_assessment_by_id_returns_none_when_not_found():
    mock_db = _make_mock_db_for_by_id(None)
    result = get_assessment_by_id(mock_db, 999)
    assert result is None


def test_get_assessment_by_id_returns_correct_assessment():
    mock_a = MagicMock()
    mock_a.assessment_id = 42
    mock_a.assessment_questions = []

    mock_db = _make_mock_db_for_by_id(mock_a)
    result = get_assessment_by_id(mock_db, 42)

    assert result is not None
    assert result.assessment_id == 42


def test_get_assessment_by_id_includes_questions_list():
    mock_aq = MagicMock()
    mock_aq.display_order = 1

    mock_a = MagicMock()
    mock_a.assessment_id = 1
    mock_a.assessment_questions = [mock_aq]

    mock_db = _make_mock_db_for_by_id(mock_a)
    result = get_assessment_by_id(mock_db, 1)

    assert hasattr(result, "assessment_questions")
    assert isinstance(result.assessment_questions, list)
    assert len(result.assessment_questions) == 1


def test_get_assessment_by_id_questions_ordered_by_display_order():
    aq1 = MagicMock()
    aq1.display_order = 3
    aq2 = MagicMock()
    aq2.display_order = 1
    aq3 = MagicMock()
    aq3.display_order = 2

    mock_a = MagicMock()
    mock_a.assessment_questions = [aq1, aq2, aq3]

    mock_db = _make_mock_db_for_by_id(mock_a)
    result = get_assessment_by_id(mock_db, 1)

    orders = [aq.display_order for aq in result.assessment_questions]
    assert orders == [1, 2, 3]


def test_get_assessment_by_id_null_display_order_sorts_last():
    aq_null = MagicMock()
    aq_null.display_order = None
    aq_first = MagicMock()
    aq_first.display_order = 1

    mock_a = MagicMock()
    mock_a.assessment_questions = [aq_null, aq_first]

    mock_db = _make_mock_db_for_by_id(mock_a)
    result = get_assessment_by_id(mock_db, 1)

    assert result.assessment_questions[0].display_order == 1
    assert result.assessment_questions[1].display_order is None


def test_get_assessment_by_id_each_question_has_required_fields():
    mock_qb = MagicMock()
    mock_qb.question_bank_id = 10
    mock_qb.title = "What is X?"
    mock_qb.content = "Explain X in detail."
    mock_qb.type.value = "TEXT"
    mock_qb.maximum_score = 5.0
    mock_qb.tags = ["python", "oop"]

    mock_aq = MagicMock()
    mock_aq.assessment_q_id = 7
    mock_aq.display_order = 1
    mock_aq.marks = 5.0
    mock_aq.question_bank = mock_qb

    mock_a = MagicMock()
    mock_a.assessment_questions = [mock_aq]

    mock_db = _make_mock_db_for_by_id(mock_a)
    result = get_assessment_by_id(mock_db, 1)

    aq = result.assessment_questions[0]
    assert aq.assessment_q_id == 7
    assert aq.display_order == 1
    assert aq.marks == 5.0
    assert aq.question_bank.question_bank_id == 10
    assert aq.question_bank.title == "What is X?"
    assert aq.question_bank.content == "Explain X in detail."
    assert aq.question_bank.type.value == "TEXT"
    assert aq.question_bank.maximum_score == 5.0
    assert aq.question_bank.tags == ["python", "oop"]


def test_save_candidate_response_grades_json_correct_answer():
    from app.models.candidate_response import CorrectnessStatus

    mock_db = MagicMock()
    mock_session = MagicMock()

    mock_qb = MagicMock()
    mock_qb.correct_answer = {"answer": "b"}
    mock_qb.maximum_score = 4.0

    mock_aq = MagicMock()
    mock_aq.question_bank = mock_qb

    mock_db.query.side_effect = [
        _mock_query_result(mock_session),
        _mock_query_result(None),
        _mock_query_result(mock_aq),
    ]

    response_in = ResponseCreate(
        assessment_question_id=11,
        candidate_answer="b",
    )

    result = save_candidate_response(mock_db, 9, response_in)

    assert result.candidate_answer == "b"
    assert result.score == 4.0
    assert result.is_correct == CorrectnessStatus.CORRECT
def _make_mock_db_for_invite(assessment_result, candidate_result, existing_result):
    mock_db = MagicMock()

    def query_side_effect(model):
        mock_q = MagicMock()
        if model is Assessment:
            mock_q.filter.return_value.first.return_value = assessment_result
        elif model is User:
            mock_q.filter.return_value.first.return_value = candidate_result
        elif model is CandidateAssessment:
            mock_q.filter.return_value.first.return_value = existing_result
        return mock_q

    mock_db.query.side_effect = query_side_effect
    return mock_db


def test_create_candidate_assessment_raises_404_when_assessment_not_found():
    mock_db = _make_mock_db_for_invite(None, MagicMock(), None)
    with pytest.raises(HTTPException) as exc_info:
        create_candidate_assessment(mock_db, assessment_id=99, candidate_id=1)
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Assessment not found"


def test_create_candidate_assessment_raises_404_when_candidate_not_found():
    mock_db = _make_mock_db_for_invite(MagicMock(), None, None)
    with pytest.raises(HTTPException) as exc_info:
        create_candidate_assessment(mock_db, assessment_id=1, candidate_id=99)
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Candidate not found"


def test_create_candidate_assessment_raises_400_when_already_invited():
    mock_db = _make_mock_db_for_invite(MagicMock(), MagicMock(), MagicMock())
    with pytest.raises(HTTPException) as exc_info:
        create_candidate_assessment(mock_db, assessment_id=1, candidate_id=1)
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Candidate has already been invited to this assessment"


def test_create_candidate_assessment_returns_session_with_correct_fields():
    mock_db = _make_mock_db_for_invite(MagicMock(), MagicMock(), None)

    def refresh_side_effect(obj):
        obj.candidate_assess_id = 5
        obj.assessment_id = 1
        obj.candidate_id = 2
        obj.status = SessionStatus.STARTED

    mock_db.refresh.side_effect = refresh_side_effect

    result = create_candidate_assessment(mock_db, assessment_id=1, candidate_id=2)

    assert result.candidate_assess_id == 5
    assert result.assessment_id == 1
    assert result.candidate_id == 2
    assert result.status == SessionStatus.STARTED
    assert result.candidate_score is None
    assert result.total_score is None
    assert result.start_time is None
    assert result.end_time is None


def test_create_candidate_assessment_access_token_is_valid_uuid():
    mock_db = _make_mock_db_for_invite(MagicMock(), MagicMock(), None)
    mock_db.refresh.side_effect = None

    result = create_candidate_assessment(mock_db, assessment_id=1, candidate_id=2)

    parsed = uuid.UUID(result.access_token)
    assert str(parsed) == result.access_token


def _make_mock_db_for_start(session_result, assessment_result=None):
    mock_db = MagicMock()

    def query_side_effect(model):
        mock_q = MagicMock()
        if model is CandidateAssessment:
            mock_q.filter.return_value.first.return_value = session_result
        elif model is Assessment:
            mock_q.filter.return_value.first.return_value = assessment_result
        return mock_q

    mock_db.query.side_effect = query_side_effect
    return mock_db


def test_start_candidate_assessment_raises_404_when_token_not_found():
    mock_db = _make_mock_db_for_start(None)
    with pytest.raises(HTTPException) as exc_info:
        start_candidate_assessment(mock_db, "nonexistent-token")
    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Invalid access token"


def test_start_candidate_assessment_raises_400_when_in_progress():
    mock_session = MagicMock()
    mock_session.status = SessionStatus.IN_PROGRESS
    mock_db = _make_mock_db_for_start(mock_session)
    with pytest.raises(HTTPException) as exc_info:
        start_candidate_assessment(mock_db, "some-token")
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Assessment has already been started"


def test_start_candidate_assessment_raises_400_when_completed():
    mock_session = MagicMock()
    mock_session.status = SessionStatus.COMPLETED
    mock_db = _make_mock_db_for_start(mock_session)
    with pytest.raises(HTTPException) as exc_info:
        start_candidate_assessment(mock_db, "some-token")
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Assessment has already been completed"


def test_start_candidate_assessment_raises_400_when_expired():
    mock_session = MagicMock()
    mock_session.status = SessionStatus.EXPIRED
    mock_db = _make_mock_db_for_start(mock_session)
    with pytest.raises(HTTPException) as exc_info:
        start_candidate_assessment(mock_db, "some-token")
    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == "Assessment has expired"


def test_start_candidate_assessment_returns_in_progress_status():
    mock_session = MagicMock()
    mock_session.status = SessionStatus.STARTED
    mock_session.assessment_id = 1

    mock_assessment = MagicMock()
    mock_assessment.duration_mins = 60

    mock_db = _make_mock_db_for_start(mock_session, mock_assessment)

    result = start_candidate_assessment(mock_db, "valid-token")
    assert result.status == SessionStatus.IN_PROGRESS


def test_start_candidate_assessment_sets_start_time():
    mock_session = MagicMock()
    mock_session.status = SessionStatus.STARTED
    mock_session.assessment_id = 1

    mock_assessment = MagicMock()
    mock_assessment.duration_mins = 60

    mock_db = _make_mock_db_for_start(mock_session, mock_assessment)

    start_candidate_assessment(mock_db, "valid-token")
    assert isinstance(mock_session.start_time, datetime)


def test_start_candidate_assessment_end_time_is_start_plus_duration():
    mock_session = MagicMock()
    mock_session.status = SessionStatus.STARTED
    mock_session.assessment_id = 1

    mock_assessment = MagicMock()
    mock_assessment.duration_mins = 45

    mock_db = _make_mock_db_for_start(mock_session, mock_assessment)

    start_candidate_assessment(mock_db, "valid-token")
    assert mock_session.end_time == mock_session.start_time + timedelta(minutes=45)


def test_start_candidate_assessment_end_time_greater_than_start_time():
    mock_session = MagicMock()
    mock_session.status = SessionStatus.STARTED
    mock_session.assessment_id = 1

    mock_assessment = MagicMock()
    mock_assessment.duration_mins = 30

    mock_db = _make_mock_db_for_start(mock_session, mock_assessment)

    start_candidate_assessment(mock_db, "valid-token")
    assert mock_session.end_time > mock_session.start_time


def _make_mock_db_for_my_assessments(results):
    mock_db = MagicMock()
    (
        mock_db.query.return_value
        .options.return_value
        .filter.return_value
        .all.return_value
    ) = results
    return mock_db


def test_get_candidate_assessments_returns_empty_list():
    mock_db = _make_mock_db_for_my_assessments([])
    result = get_candidate_assessments(mock_db, candidate_id=1)
    assert result == []


def test_get_candidate_assessments_returns_list_with_items():
    mock_session = MagicMock()
    mock_db = _make_mock_db_for_my_assessments([mock_session])
    result = get_candidate_assessments(mock_db, candidate_id=1)
    assert len(result) == 1
    assert result[0] is mock_session


def test_get_candidate_assessments_loads_assessment_relation():
    mock_assessment = MagicMock()
    mock_assessment.assessment_id = 42
    mock_session = MagicMock()
    mock_session.assessment = mock_assessment
    mock_db = _make_mock_db_for_my_assessments([mock_session])
    result = get_candidate_assessments(mock_db, candidate_id=1)
    assert result[0].assessment.assessment_id == 42


def test_get_candidate_assessments_returns_all_matching_sessions():
    session_a = MagicMock()
    session_b = MagicMock()
    mock_db = _make_mock_db_for_my_assessments([session_a, session_b])
    result = get_candidate_assessments(mock_db, candidate_id=3)
    assert len(result) == 2
    assert result[0] is session_a
    assert result[1] is session_b
