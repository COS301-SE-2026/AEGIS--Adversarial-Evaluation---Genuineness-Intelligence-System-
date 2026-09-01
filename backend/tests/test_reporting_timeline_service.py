from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.models.candidate_assessment import CandidateAssessment, SessionStatus
from app.models.candidate_response_metrics import CandidateResponseMetrics
from app.models.assessment_question import AssessmentQuestion
from app.models.adversarial_question import AdversarialQuestion
from app.services import reporting_timeline as timeline_service


def make_session(**overrides):
    values = {
        "candidate_assess_id": 12,
        "assessment_id": 99,
        "behavioral_summary": None,
    }
    values.update(overrides)
    return CandidateAssessment(**values)


def make_metrics(**overrides):
    values = {
        "candidate_response_id": 1,
        "candidate_assessment_id": 12,
        "active_time_ms": 60000,
        "chars_alnum": 100,
        "chars_special": 0,
        "paste_event_count": 0,
        "paste_char_count": 0,
        "focus_loss_count": 0,
        "focus_loss_time_ms": 0,
    }
    values.update(overrides)
    return CandidateResponseMetrics(**values)


def make_assessment_question(**overrides):
    values = {"assessment_q_id": 1, "display_order": 1}
    values.update(overrides)
    return AssessmentQuestion(**values)


def make_adversarial_question(**overrides):
    values = {"adv_question_id": 1, "source_question_id": 501}
    values.update(overrides)
    return AdversarialQuestion(**values)


def _stub_session_query(mock_db, session):
    query = MagicMock(**{"filter.return_value.first.return_value": session})
    mock_db.query.side_effect = [query]


def _stub_timeline_queries(
    mock_db, session, rows, other_completed_count, cohort_rows_by_call=None,
):
    cohort_rows_by_call = cohort_rows_by_call or []

    session_query = MagicMock(
        **{"filter.return_value.first.return_value": session},
    )
    rows_query = MagicMock(**{
        "join.return_value.join.return_value.outerjoin.return_value"
        ".filter.return_value.order_by.return_value.all.return_value": rows,
    })
    count_query = MagicMock(
        **{"filter.return_value.count.return_value": other_completed_count},
    )
    cohort_queries = [
        MagicMock(**{
            "join.return_value.join.return_value.filter.return_value"
            ".all.return_value": cohort_rows,
        })
        for cohort_rows in cohort_rows_by_call
    ]

    mock_db.query.side_effect = (
        [session_query, rows_query, count_query] + cohort_queries
    )


def test_get_behavioral_summary_returns_real_value():
    session = make_session(behavioral_summary="Typed steadily throughout.")
    db = MagicMock()
    _stub_session_query(db, session)

    result = timeline_service.get_behavioral_summary(db, 12)

    assert result.summary == "Typed steadily throughout."
    assert result.generated_at is None


def test_get_behavioral_summary_returns_null_when_not_generated():
    session = make_session(behavioral_summary=None)
    db = MagicMock()
    _stub_session_query(db, session)

    result = timeline_service.get_behavioral_summary(db, 12)

    assert result.summary is None
    assert result.generated_at is None


def test_get_behavioral_summary_raises_404_when_missing():
    db = MagicMock()
    _stub_session_query(db, None)

    with pytest.raises(HTTPException) as error:
        timeline_service.get_behavioral_summary(db, 999)

    assert error.value.status_code == 404


def test_get_metrics_timeline_raises_404_when_missing():
    db = MagicMock()
    _stub_session_query(db, None)

    with pytest.raises(HTTPException) as error:
        timeline_service.get_metrics_timeline(db, 999)

    assert error.value.status_code == 404


def test_get_metrics_timeline_emits_paste_and_focus_loss_events():
    session = make_session()
    aq = make_assessment_question(assessment_q_id=1, display_order=1)
    adv = make_adversarial_question(source_question_id=501)
    metrics = make_metrics(
        paste_event_count=2, paste_char_count=340,
        focus_loss_count=3, focus_loss_time_ms=9000,
    )
    rows = [(MagicMock(), aq, adv, metrics)]

    db = MagicMock()
    _stub_timeline_queries(db, session, rows, other_completed_count=0)

    result = timeline_service.get_metrics_timeline(db, 12)

    assert result.total_active_time_ms == 60000
    segment = result.questions[0]
    assert segment.question_id == 501
    assert segment.question_order == 1
    event_types = {event.event_type for event in segment.events}
    assert event_types == {"paste", "focus_loss"}

    paste_event = next(
        e for e in segment.events if e.event_type == "paste"
    )
    assert paste_event.magnitude == 340
    assert paste_event.start_offset_ms == 0
    assert paste_event.duration_ms == 60000

    focus_event = next(
        e for e in segment.events if e.event_type == "focus_loss"
    )
    assert focus_event.magnitude == 3


def test_get_metrics_timeline_skips_events_when_counts_are_zero():
    session = make_session()
    aq = make_assessment_question()
    adv = make_adversarial_question()
    metrics = make_metrics(
        paste_event_count=0, focus_loss_count=0,
    )
    rows = [(MagicMock(), aq, adv, metrics)]

    db = MagicMock()
    _stub_timeline_queries(db, session, rows, other_completed_count=0)

    result = timeline_service.get_metrics_timeline(db, 12)

    assert result.questions[0].events == []


def test_get_metrics_timeline_handles_missing_metrics_row():
    session = make_session()
    aq = make_assessment_question()
    adv = make_adversarial_question()
    rows = [(MagicMock(), aq, adv, None)]

    db = MagicMock()
    _stub_timeline_queries(db, session, rows, other_completed_count=0)

    result = timeline_service.get_metrics_timeline(db, 12)

    assert result.total_active_time_ms == 0
    assert result.questions[0].active_time_ms == 0
    assert result.questions[0].events == []


def test_get_metrics_timeline_orders_questions_by_display_order():
    session = make_session()
    aq1 = make_assessment_question(assessment_q_id=1, display_order=2)
    aq2 = make_assessment_question(assessment_q_id=2, display_order=1)
    adv1 = make_adversarial_question(adv_question_id=1, source_question_id=10)
    adv2 = make_adversarial_question(adv_question_id=2, source_question_id=20)
    metrics1 = make_metrics(candidate_response_id=1)
    metrics2 = make_metrics(candidate_response_id=2)
    # rows are returned in the order the (mocked) DB query already sorted
    # them by display_order -- aq2 (display_order=1) comes first
    rows = [
        (MagicMock(), aq2, adv2, metrics2),
        (MagicMock(), aq1, adv1, metrics1),
    ]

    db = MagicMock()
    _stub_timeline_queries(db, session, rows, other_completed_count=0)

    result = timeline_service.get_metrics_timeline(db, 12)

    assert [q.question_id for q in result.questions] == [20, 10]
    assert [q.question_order for q in result.questions] == [1, 2]


def test_get_metrics_timeline_emits_typing_burst_above_threshold():
    session = make_session()
    aq = make_assessment_question(assessment_q_id=1)
    adv = make_adversarial_question(source_question_id=501)
    # 100 chars / 10s = 10 chars/sec
    metrics = make_metrics(
        active_time_ms=10000, chars_alnum=100, chars_special=0,
    )
    rows = [(MagicMock(), aq, adv, metrics)]

    # cohort average is 2 chars/sec -- candidate rate (10) is > 2x that (4)
    cohort_rows = [
        make_metrics(
            candidate_response_id=2, active_time_ms=10000,
            chars_alnum=20, chars_special=0,
        ),
    ]

    db = MagicMock()
    _stub_timeline_queries(
        db, session, rows, other_completed_count=3,
        cohort_rows_by_call=[cohort_rows],
    )

    result = timeline_service.get_metrics_timeline(db, 12)

    event_types = {e.event_type for e in result.questions[0].events}
    assert "typing_burst" in event_types
    burst_event = next(
        e for e in result.questions[0].events
        if e.event_type == "typing_burst"
    )
    assert burst_event.magnitude is None


def test_get_metrics_timeline_skips_typing_burst_below_threshold():
    session = make_session()
    aq = make_assessment_question(assessment_q_id=1)
    adv = make_adversarial_question(source_question_id=501)
    # 20 chars / 10s = 2 chars/sec -- not above 2x the cohort average
    metrics = make_metrics(
        active_time_ms=10000, chars_alnum=20, chars_special=0,
    )
    rows = [(MagicMock(), aq, adv, metrics)]

    cohort_rows = [
        make_metrics(
            candidate_response_id=2, active_time_ms=10000,
            chars_alnum=20, chars_special=0,
        ),
    ]

    db = MagicMock()
    _stub_timeline_queries(
        db, session, rows, other_completed_count=3,
        cohort_rows_by_call=[cohort_rows],
    )

    result = timeline_service.get_metrics_timeline(db, 12)

    event_types = {e.event_type for e in result.questions[0].events}
    assert "typing_burst" not in event_types


def test_get_metrics_timeline_skips_typing_burst_with_insufficient_cohort():
    session = make_session()
    aq = make_assessment_question(assessment_q_id=1)
    adv = make_adversarial_question(source_question_id=501)
    metrics = make_metrics(
        active_time_ms=10000, chars_alnum=1000, chars_special=0,
    )
    rows = [(MagicMock(), aq, adv, metrics)]

    db = MagicMock()
    # only 2 other candidates have completed -- below the minimum of 3
    _stub_timeline_queries(db, session, rows, other_completed_count=2)

    result = timeline_service.get_metrics_timeline(db, 12)

    event_types = {e.event_type for e in result.questions[0].events}
    assert "typing_burst" not in event_types
    # no cohort query should even have been attempted
    assert db.query.call_count == 3
