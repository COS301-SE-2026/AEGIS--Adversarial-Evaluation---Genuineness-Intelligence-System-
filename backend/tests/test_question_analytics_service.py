from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.models.adversarial_question import AdversarialQuestion
from app.models.assessment_question import AssessmentQuestion
from app.models.candidate_assessment import CandidateAssessment
from app.models.candidate_response import (
    CandidateResponse,
    CorrectnessStatus,
)
from app.models.candidate_response_metrics import CandidateResponseMetrics
from app.models.question_bank import QuestionBank, QuestionType
from app.services import question_analytics as analytics_service
from app.services.cohort_metrics import MIN_COHORT_CANDIDATES
from app.services.review_priority import (
    QuestionInfo,
    QuestionMetrics,
    get_question_review_score,
)
from app.services.question_analytics import (
    get_my_question_results,
    get_question_analytics,
)


def make_session(**overrides):
    values = {
        "candidate_assess_id": 12,
        "assessment_id": 99,
    }
    values.update(overrides)
    return CandidateAssessment(**values)


def make_assessment_question(**overrides):
    values = {
        "assessment_q_id": 1,
        "assessments_id": 99,
        "adv_question_id": 1,
        "display_order": 1,
    }
    values.update(overrides)
    return AssessmentQuestion(**values)


def make_adversarial_question(**overrides):
    values = {
        "adv_question_id": 1,
        "source_question_id": 501,
        "content": "Adversarial question content",
        "strategy_id": 1,
    }
    values.update(overrides)
    return AdversarialQuestion(**values)


def make_question_bank(**overrides):
    values = {
        "question_bank_id": 501,
        "title": "Question title",
        "content": "Source question content",
        "type": QuestionType.MULTIPLE_CHOICE,
        "maximum_score": 10,
    }
    values.update(overrides)
    return QuestionBank(**values)


def make_response(**overrides):
    values = {
        "response_id": 1,
        "candidate_assessment_id": 12,
        "assessment_question_id": 1,
        "candidate_answer": "Candidate answer",
        "score": 8.0,
        "is_correct": CorrectnessStatus.CORRECT,
    }
    values.update(overrides)
    return CandidateResponse(**values)


def make_metrics(**overrides):
    values = {
        "candidate_response_id": 1,
        "candidate_assessment_id": 12,
        "active_time_ms": 60000,
        "backspace_count": 2,
        "chars_alnum": 100,
        "chars_special": 0,
        "copy_event_count": 1,
        "copy_char_count": 10,
        "paste_event_count": 1,
        "paste_char_count": 5,
        "focus_loss_count": 1,
        "focus_loss_time_ms": 10000,
    }
    values.update(overrides)
    return CandidateResponseMetrics(**values)


def make_row(
    *,
    question_id=1,
    display_order=1,
    response=None,
    metrics=None,
    question_type=QuestionType.MULTIPLE_CHOICE,
    question_content="Adversarial question content",
):
    assessment_question = make_assessment_question(
        assessment_q_id=question_id,
        adv_question_id=question_id,
        display_order=display_order,
    )
    adversarial_question = make_adversarial_question(
        adv_question_id=question_id,
        source_question_id=500 + question_id,
        content=question_content,
    )
    question_bank = make_question_bank(
        question_bank_id=500 + question_id,
        type=question_type,
    )
    return (
        assessment_question,
        adversarial_question,
        question_bank,
        response,
        metrics,
    )


def configure_queries(db, rows, *, session=None):
    session_query = MagicMock()
    session_query.filter.return_value.first.return_value = session

    ordered_rows = sorted(
        rows,
        key=lambda row: (
            row[0].display_order,
            row[0].assessment_q_id,
        ),
    )

    rows_query = MagicMock()
    rows_query.join.return_value = rows_query
    rows_query.outerjoin.return_value = rows_query
    rows_query.filter.return_value = rows_query
    rows_query.order_by.return_value = rows_query
    rows_query.all.return_value = ordered_rows

    count_query = MagicMock()
    count_query.filter.return_value.count.return_value = 0

    db.query.side_effect = [
        session_query,
        rows_query,
        count_query,
    ]


def configure_missing_session_query(db):
    session_query = MagicMock()
    session_query.filter.return_value.first.return_value = None
    db.query.side_effect = [session_query]


def test_get_question_analytics_orders_questions_by_display_order():
    session = make_session()

    first_response = make_response(
        response_id=101,
        assessment_question_id=1,
    )
    first_metrics = make_metrics(candidate_response_id=101)

    second_response = make_response(
        response_id=102,
        assessment_question_id=2,
    )
    second_metrics = make_metrics(candidate_response_id=102)

    rows = [
        make_row(
            question_id=2,
            display_order=2,
            response=second_response,
            metrics=second_metrics,
        ),
        make_row(
            question_id=1,
            display_order=1,
            response=first_response,
            metrics=first_metrics,
        ),
    ]

    db = MagicMock()
    configure_queries(db, rows, session=session)

    result = get_question_analytics(db, candidate_assessment_id=12)

    assert [item.assessment_q_id for item in result.questions] == [1, 2]


def test_get_question_analytics_preserves_unanswered_question():
    session = make_session()

    answered_response = make_response(
        response_id=101,
        assessment_question_id=1,
    )
    answered_metrics = make_metrics(candidate_response_id=101)

    rows = [
        make_row(
            question_id=1,
            display_order=1,
            response=answered_response,
            metrics=answered_metrics,
        ),
        make_row(
            question_id=2,
            display_order=2,
            response=None,
            metrics=None,
        ),
    ]

    db = MagicMock()
    configure_queries(db, rows, session=session)

    result = get_question_analytics(db, candidate_assessment_id=12)

    unanswered = result.questions[1]

    assert unanswered.answered is False
    assert unanswered.answer is None
    assert unanswered.metrics is None
    assert unanswered.review_score is None
    assert unanswered.review_band is None
    assert unanswered.contributing_factors == []

    answered = result.questions[0]
    assert answered.answered is True
    assert answered.review_score is not None


def test_get_question_analytics_scores_answer_without_telemetry():
    session = make_session()
    response = make_response(response_id=101)

    rows = [
        make_row(
            question_id=1,
            display_order=1,
            response=response,
            metrics=None,
        ),
    ]

    db = MagicMock()
    configure_queries(db, rows, session=session)

    result = get_question_analytics(db, candidate_assessment_id=12)

    item = result.questions[0]

    assert item.answered is True
    assert item.metrics is None
    assert isinstance(item.review_score, float)
    assert item.review_band in {"low", "medium", "high"}


def test_get_question_analytics_populates_answer_and_telemetry():
    session = make_session()
    response = make_response(
        response_id=101,
        candidate_answer="submitted answer",
        is_correct=CorrectnessStatus.PARTIAL,
    )
    metrics = make_metrics(candidate_response_id=101)

    rows = [
        make_row(
            question_id=1,
            display_order=1,
            response=response,
            metrics=metrics,
        ),
    ]

    db = MagicMock()
    configure_queries(db, rows, session=session)

    result = get_question_analytics(db, candidate_assessment_id=12)

    item = result.questions[0]

    assert item.answered is True
    assert item.answer is not None
    assert item.answer.candidate_answer == "submitted answer"
    assert item.answer.score == 8.0
    assert item.answer.is_correct == "PARTIAL"
    assert item.metrics is not None
    assert item.metrics.active_time_ms == metrics.active_time_ms
    assert item.metrics.backspace_count == metrics.backspace_count
    assert item.metrics.copy_event_count == metrics.copy_event_count
    assert item.metrics.copy_char_count == metrics.copy_char_count
    assert item.metrics.paste_event_count == metrics.paste_event_count
    assert item.metrics.paste_char_count == metrics.paste_char_count
    assert item.metrics.focus_loss_count == metrics.focus_loss_count
    assert item.metrics.focus_loss_time_ms == metrics.focus_loss_time_ms


def test_get_question_analytics_matches_shared_review_score():
    session = make_session()
    response = make_response(response_id=101)
    metrics = make_metrics(
        candidate_response_id=101,
        active_time_ms=60000,
        focus_loss_time_ms=10000,
        chars_alnum=100,
        chars_special=0,
        paste_char_count=5,
        copy_char_count=10,
        copy_event_count=1,
    )

    rows = [
        make_row(
            question_id=1,
            display_order=1,
            response=response,
            metrics=metrics,
        ),
    ]

    db = MagicMock()
    configure_queries(db, rows, session=session)

    result = get_question_analytics(db, candidate_assessment_id=12)

    expected_score, expected_factors = get_question_review_score(
        QuestionInfo(
            order=1,
            type=QuestionType.MULTIPLE_CHOICE,
        ),
        QuestionMetrics(
            active_time_ms=metrics.active_time_ms,
            focus_loss_time_ms=metrics.focus_loss_time_ms,
            paste_char_count=metrics.paste_char_count,
            chars_alnum=metrics.chars_alnum,
            chars_special=metrics.chars_special,
            copy_char_count=metrics.copy_char_count,
            copy_event_count=metrics.copy_event_count,
        ),
        cohort_data=None,
    )

    item = result.questions[0]

    assert item.review_score == pytest.approx(expected_score)
    assert item.contributing_factors == expected_factors


def test_get_question_analytics_rounds_score_before_banding():
    session = make_session()
    response = make_response(response_id=101)
    metrics = make_metrics(
        candidate_response_id=101,
        active_time_ms=75000,
        focus_loss_time_ms=29600,
        copy_char_count=0,
        copy_event_count=0,
    )

    rows = [
        make_row(
            question_id=1,
            display_order=1,
            response=response,
            metrics=metrics,
        ),
    ]

    db = MagicMock()
    configure_queries(db, rows, session=session)

    result = get_question_analytics(db, candidate_assessment_id=12)

    item = result.questions[0]

    assert item.review_score == pytest.approx(29.6)
    assert item.review_band == "medium"


def test_get_question_analytics_raises_404_for_unknown_session():
    db = MagicMock()
    configure_missing_session_query(db)

    with pytest.raises(HTTPException) as exception_info:
        get_question_analytics(db, candidate_assessment_id=999)

    assert exception_info.value.status_code == 404


def test_get_question_analytics_does_not_use_cohort_without_enough_sessions(
    monkeypatch,
):
    session = make_session()
    response = make_response(response_id=101)
    metrics = make_metrics(candidate_response_id=101)

    rows = [
        make_row(
            question_id=1,
            display_order=1,
            response=response,
            metrics=metrics,
        ),
    ]

    db = MagicMock()
    configure_queries(db, rows, session=session)

    count_calls = []

    def fake_count_other_completed_sessions(
        database,
        assessment_id,
        candidate_assessment_id,
    ):
        count_calls.append(
            (database, assessment_id, candidate_assessment_id),
        )
        return MIN_COHORT_CANDIDATES - 1

    def fail_if_cohort_average_is_called(
        database,
        assessment_question_id,
        candidate_assessment_id,
    ):
        raise AssertionError(
            "cohort average should not be called without enough sessions",
        )

    monkeypatch.setattr(
        analytics_service,
        "count_other_completed_sessions",
        fake_count_other_completed_sessions,
    )
    monkeypatch.setattr(
        analytics_service,
        "cohort_average_active_time_ms",
        fail_if_cohort_average_is_called,
    )

    get_question_analytics(db, candidate_assessment_id=12)

    assert count_calls == [(db, 99, 12)]


def test_get_question_analytics_uses_cohort_with_enough_sessions(
    monkeypatch,
):
    session = make_session()
    response = make_response(response_id=101)
    metrics = make_metrics(candidate_response_id=101)

    rows = [
        make_row(
            question_id=1,
            display_order=1,
            response=response,
            metrics=metrics,
        ),
    ]

    db = MagicMock()
    configure_queries(db, rows, session=session)

    count_calls = []
    cohort_calls = []

    def fake_count_other_completed_sessions(
        database,
        assessment_id,
        candidate_assessment_id,
    ):
        count_calls.append(
            (database, assessment_id, candidate_assessment_id),
        )
        return MIN_COHORT_CANDIDATES

    def fake_cohort_average_active_time_ms(
        database,
        assessment_question_id,
        candidate_assessment_id,
    ):
        cohort_calls.append(
            (database, assessment_question_id, candidate_assessment_id),
        )
        return 120000

    monkeypatch.setattr(
        analytics_service,
        "count_other_completed_sessions",
        fake_count_other_completed_sessions,
    )
    monkeypatch.setattr(
        analytics_service,
        "cohort_average_active_time_ms",
        fake_cohort_average_active_time_ms,
    )

    get_question_analytics(db, candidate_assessment_id=12)

    assert count_calls == [(db, 99, 12)]
    assert cohort_calls == [(db, 1, 12)]


def test_get_my_question_results_returns_candidate_safe_shape():
    session = make_session(candidate_id=7)
    response = make_response(response_id=101)
    metrics = make_metrics(candidate_response_id=101)

    db = MagicMock()
    configure_queries(
        db,
        [
            make_row(
                response=response,
                metrics=metrics,
            )
        ],
        session=session,
    )

    result = get_my_question_results(db, 7, 12)
    item = result.questions[0]

    assert item.answered is True
    assert item.answer is not None
    assert not hasattr(item, "metrics")
    assert not hasattr(item, "review_score")
    assert not hasattr(item, "review_band")
    assert not hasattr(item, "contributing_factors")


def test_get_my_question_results_rejects_other_candidate():
    session = make_session(candidate_id=7)
    db = MagicMock()
    configure_queries(db, [], session=session)

    with pytest.raises(HTTPException) as exception_info:
        get_my_question_results(db, 8, 12)

    assert exception_info.value.status_code == 403
    assert (
        exception_info.value.detail
        == "You can only view your own assessment results."
    )


def test_get_my_question_results_returns_404_for_unknown_session():
    db = MagicMock()
    configure_missing_session_query(db)

    with pytest.raises(HTTPException) as exception_info:
        get_my_question_results(db, 7, 999)

    assert exception_info.value.status_code == 404


def test_get_my_question_results_preserves_unanswered_question():
    session = make_session(candidate_id=7)
    db = MagicMock()
    configure_queries(
        db,
        [make_row(response=None, metrics=None)],
        session=session,
    )

    result = get_my_question_results(db, 7, 12)
    item = result.questions[0]

    assert item.answered is False
    assert item.answer is None
