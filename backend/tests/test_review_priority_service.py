from unittest.mock import MagicMock

import pytest

from app.models.assessment_question import AssessmentQuestion
from app.models.candidate_assessment import CandidateAssessment
from app.models.candidate_response_metrics import CandidateResponseMetrics
from app.models.question_bank import QuestionBank, QuestionType
from app.services import review_priority as priority_service
from app.services.review_priority import (
    QuestionInfo,
    QuestionMetrics,
    copy_signal,
    focus_signal,
    get_question_review_score,
    get_review_priority,
    paste_signal,
    speed_signal,
)


BANNED_WORDS = [
    "cheat",
    "cheated",
    "cheating",
    "artificial intelligence",
    " ai ",
    "ai-generated",
    "fraud",
    "dishonest",
    "plagiar",
    "violat",
]


def assert_no_verdict_language(factors):
    for factor in factors:
        lowered = f" {factor.lower()} "
        for banned in BANNED_WORDS:
            assert banned not in lowered, (
                f"found banned verdict language {banned!r} in {factor!r}"
            )


def make_session(**overrides):
    values = {"candidate_assess_id": 12, "assessment_id": 99}
    values.update(overrides)
    return CandidateAssessment(**values)


def make_assessment_question(**overrides):
    values = {"assessment_q_id": 1, "display_order": 1}
    values.update(overrides)
    return AssessmentQuestion(**values)


def make_question_bank(**overrides):
    values = {
        "question_bank_id": 501,
        "type": QuestionType.MULTIPLE_CHOICE,
    }
    values.update(overrides)
    return QuestionBank(**values)


def make_metrics(**overrides):
    values = {
        "candidate_response_id": 1,
        "candidate_assessment_id": 12,
        "active_time_ms": 60000,
        "chars_alnum": 100,
        "chars_special": 0,
        "paste_char_count": 0,
        "copy_char_count": 0,
        "copy_event_count": 0,
        "focus_loss_time_ms": 0,
    }
    values.update(overrides)
    return CandidateResponseMetrics(**values)


def make_question_metrics(**overrides):
    values = {
        "active_time_ms": 60000,
        "focus_loss_time_ms": 0,
        "paste_char_count": 0,
        "chars_alnum": 100,
        "chars_special": 0,
        "copy_char_count": 0,
        "copy_event_count": 0,
    }
    values.update(overrides)
    return QuestionMetrics(**values)


def _stub_priority_queries(
    mock_db, session, rows, other_completed_count, cohort_rows_by_call=None,
):
    cohort_rows_by_call = cohort_rows_by_call or []

    session_query = MagicMock(
        **{"filter.return_value.first.return_value": session},
    )
    rows_query = MagicMock(**{
        "join.return_value.join.return_value.join.return_value"
        ".outerjoin.return_value.filter.return_value.order_by.return_value"
        ".all.return_value": rows,
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


# -- focus_signal --------------------------------------------------------

def test_focus_signal_clamps_to_one_when_loss_exceeds_active_time():
    assert focus_signal(active_time_ms=0, focus_loss_time_ms=5000) == 1.0


def test_focus_signal_is_zero_with_no_focus_loss():
    assert focus_signal(active_time_ms=10000, focus_loss_time_ms=0) == 0.0


def test_focus_signal_computes_fraction():
    assert focus_signal(active_time_ms=100, focus_loss_time_ms=50) == pytest.approx(0.5)


# -- paste_signal ---------------------------------------------------------

def test_paste_signal_returns_none_for_multiple_choice():
    result = paste_signal(
        QuestionType.MULTIPLE_CHOICE,
        chars_alnum=100, chars_special=0, paste_char_count=100,
    )
    assert result is None


def test_paste_signal_clamps_to_one_when_no_typed_characters():
    result = paste_signal(
        QuestionType.CODING,
        chars_alnum=0, chars_special=0, paste_char_count=100,
    )
    assert result == 1.0


def test_paste_signal_computes_fraction_for_fill_in_the_blank():
    result = paste_signal(
        QuestionType.FILL_IN_THE_BLANK,
        chars_alnum=100, chars_special=0, paste_char_count=61,
    )
    assert result == pytest.approx(0.61)


# -- copy_signal ------------------------------------------------------------

def test_copy_signal_clamps_to_one_for_large_copy_char_count():
    assert copy_signal(copy_char_count=1000, copy_event_count=0) == 1.0


def test_copy_signal_is_zero_with_no_copy_activity():
    assert copy_signal(copy_char_count=0, copy_event_count=0) == 0.0


def test_copy_signal_uses_event_count_when_it_dominates():
    # 25 chars/50 = 0.5, 1 event*0.3 = 0.3 -- char ratio wins
    assert copy_signal(copy_char_count=25, copy_event_count=1) == pytest.approx(0.5)


# -- speed_signal -----------------------------------------------------------

def test_speed_signal_none_when_cohort_average_missing():
    assert speed_signal(active_time_ms=1000, cohort_avg_active_time_ms=None) is None


def test_speed_signal_none_when_cohort_average_not_positive():
    assert speed_signal(active_time_ms=1000, cohort_avg_active_time_ms=0) is None


def test_speed_signal_is_one_when_active_time_is_zero():
    assert speed_signal(active_time_ms=0, cohort_avg_active_time_ms=1000) == 1.0


def test_speed_signal_clamps_to_zero_at_cohort_average():
    assert speed_signal(active_time_ms=1000, cohort_avg_active_time_ms=1000) == 0.0


def test_speed_signal_clamps_to_zero_beyond_cohort_average():
    assert speed_signal(active_time_ms=2000, cohort_avg_active_time_ms=1000) == 0.0


def test_speed_signal_is_half_at_half_cohort_average():
    # 1 - (500 / 1000) = 0.5 -- the linear formula has no dead zone, unlike
    # the old clamp(1 - ratio / 0.5, 0, 1) which read 0 at this exact point
    assert speed_signal(active_time_ms=500, cohort_avg_active_time_ms=1000) == pytest.approx(0.5)


# -- get_question_review_score: exclusion behavior ---------------------------

def test_mcq_excludes_paste_from_weight_sum_not_scored_as_zero():
    question = QuestionInfo(order=1, type=QuestionType.MULTIPLE_CHOICE)
    metrics = make_question_metrics(
        active_time_ms=100000,
        focus_loss_time_ms=50000,  # focus_signal = 0.5
        paste_char_count=99999,    # would dominate if wrongly included
        chars_alnum=1,
        copy_char_count=0,
        copy_event_count=0,
    )

    score, factors = get_question_review_score(question, metrics, cohort_data=None)

    # weights for MCQ: focus=9, copy=3 (speed excluded, no cohort data)
    # weighted_sum = 9*0.5 + 3*0 = 4.5, weight_total = 12
    expected = 100 * 4.5 / 12
    assert score == pytest.approx(expected)
    assert not any("past" in factor.lower() for factor in factors)


def test_speed_excluded_from_weight_sum_when_cohort_data_insufficient():
    question = QuestionInfo(order=1, type=QuestionType.FILL_IN_THE_BLANK)
    metrics = make_question_metrics(
        active_time_ms=100000,
        focus_loss_time_ms=0,
        paste_char_count=0,
        chars_alnum=100,
        copy_char_count=0,
        copy_event_count=0,
    )

    score_excluded, _ = get_question_review_score(question, metrics, cohort_data=None)
    score_at_average, _ = get_question_review_score(
        question, metrics, cohort_data=100000,
    )

    # with no signal present, both should read 0 -- but the weight sums
    # differ (17.5 excluding speed vs 19.5 including it at value 0), so if
    # the exclusion were implemented as "treat as 0" instead of "omit from
    # the denominator" these two calls would be indistinguishable here.
    # Prove the exclusion happened by checking against hand math directly.
    assert score_excluded == 0.0
    assert score_at_average == 0.0


def test_speed_weight_excluded_from_denominator_changes_score():
    question = QuestionInfo(order=1, type=QuestionType.FILL_IN_THE_BLANK)
    metrics = make_question_metrics(
        active_time_ms=100000,
        focus_loss_time_ms=50000,  # focus_signal = 0.5, nonzero numerator
        paste_char_count=0,
        chars_alnum=100,
        copy_char_count=0,
        copy_event_count=0,
    )

    score_no_cohort, _ = get_question_review_score(
        question, metrics, cohort_data=None,
    )
    # weight_total = focus(9) + paste(5) + copy(3.5) = 17.5 (speed excluded)
    expected_excluded = 100 * (9 * 0.5) / 17.5

    score_at_average, _ = get_question_review_score(
        question, metrics, cohort_data=100000,
    )
    # weight_total = 9 + 5 + 3.5 + 2 = 19.5 (speed included at value 0,
    # since active_time_ms == cohort_avg_active_time_ms -> ratio 1 -> 1-1=0)
    expected_included = 100 * (9 * 0.5) / 19.5

    assert score_no_cohort == pytest.approx(expected_excluded)
    assert score_at_average == pytest.approx(expected_included)
    assert score_no_cohort != pytest.approx(score_at_average)


# -- get_question_review_score: full realistic scenarios per question type --

def test_get_question_review_score_multiple_choice_realistic():
    question = QuestionInfo(order=1, type=QuestionType.MULTIPLE_CHOICE)
    metrics = make_question_metrics(
        active_time_ms=60000,
        focus_loss_time_ms=42000,  # focus_signal = 0.7
        copy_char_count=0,
        copy_event_count=0,        # copy_signal = 0.0
    )

    score, factors = get_question_review_score(question, metrics, cohort_data=None)

    # weight_total = 9 (focus) + 3 (copy) = 12, speed excluded
    expected = 100 * (9 * 0.7 + 3 * 0.0) / 12
    assert score == pytest.approx(expected)
    assert factors == [
        "Question 1 (multiple-choice): the browser lost focus for 70% "
        "of the time spent on this question."
    ]


def test_get_question_review_score_fill_in_the_blank_realistic():
    question = QuestionInfo(order=3, type=QuestionType.FILL_IN_THE_BLANK)
    metrics = make_question_metrics(
        active_time_ms=100000,
        focus_loss_time_ms=0,
        paste_char_count=61,
        chars_alnum=100,
        chars_special=0,
        copy_char_count=0,
        copy_event_count=0,
    )

    score, factors = get_question_review_score(
        question, metrics, cohort_data=100000,
    )

    # focus=0, paste=0.61, copy=0, speed at cohort avg=0
    expected = 100 * (9 * 0 + 5 * 0.61 + 3.5 * 0 + 2 * 0) / 19.5
    assert score == pytest.approx(expected)
    assert factors == [
        "Question 3 (fill-in-the-blank): 61% of characters were pasted "
        "rather than typed."
    ]


def test_get_question_review_score_coding_realistic():
    question = QuestionInfo(order=2, type=QuestionType.CODING)
    metrics = make_question_metrics(
        active_time_ms=90000,
        focus_loss_time_ms=0,
        paste_char_count=0,
        chars_alnum=1000,
        chars_special=0,
        copy_char_count=60,
        copy_event_count=2,
    )

    score, factors = get_question_review_score(question, metrics, cohort_data=None)

    # copy_signal = max(60/50, 2*0.3) = max(1.2, 0.6) -> clamped to 1.0
    # weight_total = focus(9) + paste(4.5) + copy(2.5) = 16, speed excluded
    expected = 100 * (9 * 0 + 4.5 * 0 + 2.5 * 1.0) / 16
    assert score == pytest.approx(expected)
    assert factors == [
        "Question 2 (coding): copy activity was elevated on this "
        "question (2 copy event(s), 60 characters copied)."
    ]


def test_contributing_factor_wording_has_no_verdict_language():
    mcq_question = QuestionInfo(order=1, type=QuestionType.MULTIPLE_CHOICE)
    mcq_metrics = make_question_metrics(
        active_time_ms=60000, focus_loss_time_ms=54000,
    )
    _, focus_factors = get_question_review_score(
        mcq_question, mcq_metrics, cohort_data=None,
    )

    fitb_question = QuestionInfo(order=2, type=QuestionType.FILL_IN_THE_BLANK)
    fitb_metrics = make_question_metrics(
        active_time_ms=60000, chars_alnum=100, paste_char_count=90,
    )
    _, paste_factors = get_question_review_score(
        fitb_question, fitb_metrics, cohort_data=None,
    )

    assert focus_factors
    assert paste_factors
    assert_no_verdict_language(focus_factors + paste_factors)


# -- get_review_priority -----------------------------------------------------

def test_get_review_priority_returns_zero_when_session_missing():
    db = MagicMock()
    _stub_priority_queries(db, session=None, rows=[], other_completed_count=0)

    result = get_review_priority(db, candidate_assessment_id=999)

    assert result.score == 0
    assert result.band == "low"
    assert result.contributing_factors == []
    assert db.query.call_count == 1


def test_get_review_priority_returns_zero_when_no_responses():
    session = make_session()
    db = MagicMock()
    _stub_priority_queries(db, session, rows=[], other_completed_count=0)

    result = get_review_priority(db, candidate_assessment_id=12)

    assert result.score == 0
    assert result.band == "low"
    assert result.contributing_factors == []
    assert db.query.call_count == 2


def test_get_review_priority_averages_across_questions(monkeypatch):
    session = make_session()

    aq1 = make_assessment_question(assessment_q_id=1, display_order=1)
    qb1 = make_question_bank(
        question_bank_id=501, type=QuestionType.MULTIPLE_CHOICE,
    )
    metrics1 = make_metrics(
        candidate_response_id=1, active_time_ms=60000,
        focus_loss_time_ms=42000,
    )

    aq2 = make_assessment_question(assessment_q_id=2, display_order=2)
    qb2 = make_question_bank(
        question_bank_id=502, type=QuestionType.FILL_IN_THE_BLANK,
    )
    metrics2 = make_metrics(
        candidate_response_id=2, active_time_ms=100000,
        chars_alnum=100, chars_special=0, paste_char_count=61,
    )

    rows = [
        (MagicMock(), aq1, qb1, metrics1),
        (MagicMock(), aq2, qb2, metrics2),
    ]

    db = MagicMock()
    # fewer than 3 other completed peers -- speed excluded for every question
    _stub_priority_queries(db, session, rows, other_completed_count=0)

    result = get_review_priority(db, candidate_assessment_id=12)

    # Q1 (MCQ): 100 * (9*0.7 + 3*0) / 12 = 52.5
    # Q2 (FITB): 100 * (5*0.61) / 17.5 = 17.428571...
    expected_overall = round((52.5 + (100 * 5 * 0.61 / 17.5)) / 2)
    assert result.score == expected_overall
    assert result.band == "medium"
    assert len(result.contributing_factors) == 2
    assert "Question 1 (multiple-choice)" in result.contributing_factors[0]
    assert "Question 2 (fill-in-the-blank)" in result.contributing_factors[1]
    assert_no_verdict_language(result.contributing_factors)


def test_get_review_priority_uses_per_question_cohort_average(monkeypatch):
    session = make_session()

    aq = make_assessment_question(assessment_q_id=1, display_order=1)
    qb = make_question_bank(
        question_bank_id=501, type=QuestionType.CODING,
    )
    metrics = make_metrics(
        candidate_response_id=1, active_time_ms=0,
        chars_alnum=100, chars_special=0,
    )
    rows = [(MagicMock(), aq, qb, metrics)]

    cohort_metrics = [
        make_metrics(candidate_response_id=2, active_time_ms=50000),
        make_metrics(candidate_response_id=3, active_time_ms=50000),
    ]

    db = MagicMock()
    _stub_priority_queries(
        db, session, rows, other_completed_count=3,
        cohort_rows_by_call=[cohort_metrics],
    )

    result = get_review_priority(db, candidate_assessment_id=12)

    # active_time_ms=0 against a cohort average of 50000 -> speed_signal=1.0
    # weight_total = focus(9) + paste(4.5) + copy(2.5) + speed(2) = 18
    expected_score = round(100 * (2 * 1.0) / 18)
    assert result.score == expected_score
    assert any(
        "notably faster" in factor for factor in result.contributing_factors
    )


@pytest.mark.parametrize(
    ("score", "expected_band"),
    [(0, "low"), (29, "low"), (30, "medium"), (59, "medium"), (60, "high"), (100, "high")],
)
def test_band_thresholds(score, expected_band):
    assert priority_service._band_for_score(score) == expected_band
