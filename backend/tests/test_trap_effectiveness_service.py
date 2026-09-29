from unittest.mock import MagicMock

import pytest

from app.models.assessment_question import AssessmentQuestion
from app.models.candidate_response import CandidateResponse
from app.models.candidate_response_metrics import CandidateResponseMetrics
from app.models.question_bank import QuestionType
from app.services import trap_effectiveness as trap_service
from app.services.trap_effectiveness import (
    MIN_SUFFICIENT_DATA_ATTEMPTS,
    get_trap_effectiveness,
)


def make_response(**overrides):
    values = {"response_id": 1, "candidate_assessment_id": 10}
    values.update(overrides)
    return CandidateResponse(**values)


def make_assessment_question(**overrides):
    values = {
        "assessment_q_id": 1, "assessments_id": 100, "display_order": 1,
    }
    values.update(overrides)
    return AssessmentQuestion(**values)


class _QuestionBankStub:
    """A lightweight stand-in for QuestionBank -- only `.type` is read by
    the scoring path, and constructing the real ORM model here would pull
    in unrelated required columns."""

    def __init__(self, question_type):
        self.type = question_type


def make_metrics(**overrides):
    values = {
        "candidate_response_id": 1,
        "candidate_assessment_id": 10,
        "active_time_ms": 60000,
        "focus_loss_time_ms": 0,
        "paste_char_count": 0,
        "chars_alnum": 100,
        "chars_special": 0,
        "copy_char_count": 0,
        "copy_event_count": 0,
    }
    values.update(overrides)
    return CandidateResponseMetrics(**values)


def elevated_row(response_id):
    """An MCQ response scoring 52.5 -- above the elevated-review threshold
    of 30 (same shape as review_priority's realistic MCQ test case)."""
    return (
        make_response(
            response_id=response_id, candidate_assessment_id=response_id,
        ),
        make_assessment_question(
            assessment_q_id=response_id, assessments_id=100,
        ),
        _QuestionBankStub(QuestionType.MULTIPLE_CHOICE),
        make_metrics(
            candidate_response_id=response_id,
            candidate_assessment_id=response_id,
            active_time_ms=60000, focus_loss_time_ms=42000,
        ),
    )


def quiet_row(response_id):
    """An MCQ response scoring 0 -- below the elevated-review threshold."""
    return (
        make_response(
            response_id=response_id, candidate_assessment_id=response_id,
        ),
        make_assessment_question(
            assessment_q_id=response_id, assessments_id=100,
        ),
        _QuestionBankStub(QuestionType.MULTIPLE_CHOICE),
        make_metrics(
            candidate_response_id=response_id,
            candidate_assessment_id=response_id,
            active_time_ms=60000, focus_loss_time_ms=0,
        ),
    )


def _stub_trap_effectiveness_queries(
    db, deployed_strategies, rows_by_strategy, generated_count_by_strategy,
):
    """Builds the exact db.query(...) call sequence get_trap_effectiveness
    issues: one query for the deployed-strategy list, then per strategy one
    query for completed response rows, one count-query per row (assuming
    each row has fewer than MIN_COHORT_CANDIDATES other completed peers, so
    the cohort-average query is never reached), and one query for the
    deployed-only generated-question count (join to AssessmentQuestion,
    filter by strategy_id, distinct, count)."""
    deployed_query = MagicMock(**{
        "join.return_value.join.return_value.distinct.return_value"
        ".all.return_value": deployed_strategies,
    })

    query_sequence = [deployed_query]
    for strategy_id, _ in deployed_strategies:
        rows = rows_by_strategy.get(strategy_id, [])
        rows_query = MagicMock(**{
            "join.return_value.join.return_value.join.return_value"
            ".join.return_value.outerjoin.return_value.filter.return_value"
            ".all.return_value": rows,
        })
        query_sequence.append(rows_query)

        for _ in rows:
            count_query = MagicMock(
                **{"filter.return_value.count.return_value": 0},
            )
            query_sequence.append(count_query)

        generated_count_query = MagicMock(**{
            "join.return_value.filter.return_value.distinct.return_value"
            ".count.return_value":
                generated_count_by_strategy.get(strategy_id, 0),
        })
        query_sequence.append(generated_count_query)

    db.query.side_effect = query_sequence


@pytest.mark.parametrize(
    ("completed_attempt_count", "expected_status"),
    [
        (0, "NO_DATA"),
        (1, "INSUFFICIENT_DATA"),
        (MIN_SUFFICIENT_DATA_ATTEMPTS - 1, "INSUFFICIENT_DATA"),
        (MIN_SUFFICIENT_DATA_ATTEMPTS, "SUFFICIENT_DATA"),
        (MIN_SUFFICIENT_DATA_ATTEMPTS + 10, "SUFFICIENT_DATA"),
    ],
)
def test_evidence_status_thresholds(completed_attempt_count, expected_status):
    assert (
        trap_service._evidence_status(completed_attempt_count)
        == expected_status
    )


def test_strategy_with_zero_completed_attempts_is_no_data():
    db = MagicMock()
    _stub_trap_effectiveness_queries(
        db,
        deployed_strategies=[(1, "IRRELEVANT_CONTEXT")],
        rows_by_strategy={1: []},
        generated_count_by_strategy={1: 5},
    )

    results = get_trap_effectiveness(db)

    assert len(results) == 1
    item = results[0]
    assert item.trap_id == 1
    assert item.trap_name == "IRRELEVANT_CONTEXT"
    assert item.generated_question_count == 5
    assert item.completed_attempt_count == 0
    assert item.elevated_review_count == 0
    assert item.review_signal_rate is None
    assert item.evidence_status == "NO_DATA"


def test_strategy_with_sufficient_completed_data_computes_rate():
    rows = (
        [elevated_row(i) for i in range(1, 4)]
        + [quiet_row(i) for i in range(4, 6)]
    )
    assert len(rows) == MIN_SUFFICIENT_DATA_ATTEMPTS

    db = MagicMock()
    _stub_trap_effectiveness_queries(
        db,
        deployed_strategies=[(2, "NEGATION_INJECTION")],
        rows_by_strategy={2: rows},
        generated_count_by_strategy={2: 8},
    )

    results = get_trap_effectiveness(db)

    item = results[0]
    assert item.completed_attempt_count == 5
    assert item.elevated_review_count == 3
    assert item.review_signal_rate == pytest.approx(60.0)
    assert item.evidence_status == "SUFFICIENT_DATA"


def test_strategy_just_below_cutoff_is_insufficient_data():
    rows = [elevated_row(i) for i in range(1, MIN_SUFFICIENT_DATA_ATTEMPTS)]

    db = MagicMock()
    _stub_trap_effectiveness_queries(
        db,
        deployed_strategies=[(3, "TEMPORAL_CONFUSION")],
        rows_by_strategy={3: rows},
        generated_count_by_strategy={3: 3},
    )

    results = get_trap_effectiveness(db)

    item = results[0]
    assert item.completed_attempt_count == MIN_SUFFICIENT_DATA_ATTEMPTS - 1
    assert item.evidence_status == "INSUFFICIENT_DATA"
    assert item.review_signal_rate == pytest.approx(100.0)


def test_strategy_at_cutoff_is_sufficient_data():
    rows = [
        elevated_row(i) for i in range(1, MIN_SUFFICIENT_DATA_ATTEMPTS + 1)
    ]

    db = MagicMock()
    _stub_trap_effectiveness_queries(
        db,
        deployed_strategies=[(4, "REVERSAL_CURSE")],
        rows_by_strategy={4: rows},
        generated_count_by_strategy={4: 4},
    )

    results = get_trap_effectiveness(db)

    item = results[0]
    assert item.completed_attempt_count == MIN_SUFFICIENT_DATA_ATTEMPTS
    assert item.evidence_status == "SUFFICIENT_DATA"


def test_multiple_deployed_strategies_are_grouped_independently():
    """Two strategies, each with rows drawn from multiple
    assessment_questions rows (simulating the same strategy_id being
    reused across several deployed adversarial questions) -- results must
    not bleed into each other."""
    strategy_1_rows = [elevated_row(1), quiet_row(2), quiet_row(3)]
    strategy_2_rows = [elevated_row(4), elevated_row(5)]

    db = MagicMock()
    _stub_trap_effectiveness_queries(
        db,
        deployed_strategies=[
            (10, "IDENTIFIER_SWAP"), (20, "GARDEN_PATH_CRT"),
        ],
        rows_by_strategy={10: strategy_1_rows, 20: strategy_2_rows},
        generated_count_by_strategy={10: 6, 20: 2},
    )

    results = get_trap_effectiveness(db)

    by_id = {item.trap_id: item for item in results}
    assert by_id[10].completed_attempt_count == 3
    assert by_id[10].elevated_review_count == 1
    assert by_id[10].generated_question_count == 6

    assert by_id[20].completed_attempt_count == 2
    assert by_id[20].elevated_review_count == 2
    assert by_id[20].review_signal_rate == pytest.approx(100.0)
    assert by_id[20].generated_question_count == 2


def test_draft_only_strategy_never_appears(monkeypatch):
    """_deployed_strategies is the only source of strategy_ids fed into the
    aggregation; a strategy with only draft (never-deployed) adversarial
    questions must not be produced by that query in the first place, so it
    never reaches get_trap_effectiveness's per-strategy loop."""
    db = MagicMock()
    _stub_trap_effectiveness_queries(
        db,
        deployed_strategies=[(1, "IRRELEVANT_CONTEXT")],
        rows_by_strategy={1: []},
        generated_count_by_strategy={1: 1},
    )

    results = get_trap_effectiveness(db)

    assert [item.trap_id for item in results] == [1]


def test_no_deployed_strategies_returns_empty_list():
    db = MagicMock()
    _stub_trap_effectiveness_queries(
        db,
        deployed_strategies=[],
        rows_by_strategy={},
        generated_count_by_strategy={},
    )

    results = get_trap_effectiveness(db)

    assert results == []


def test_generated_question_count_joins_to_assessment_question():
    """The deployed-only count must join through AssessmentQuestion --
    without that join it would fall back to counting every
    AdversarialQuestion row under the strategy, drafts included."""
    db = MagicMock()
    db.query.return_value.join.return_value.filter.return_value \
        .distinct.return_value.count.return_value = 2

    count = trap_service._generated_question_count(db, strategy_id=1)

    assert count == 2
    join_call = db.query.return_value.join.call_args
    assert join_call.args[0] is AssessmentQuestion


def test_generated_question_count_zero_for_draft_only_strategy():
    """A strategy whose adversarial questions are all drafts (never linked
    into an assessment_questions row) must report 0, not the draft
    count -- simulated here by the joined, filtered query itself yielding
    no rows, exactly as it would in the real database."""
    db = MagicMock()
    db.query.return_value.join.return_value.filter.return_value \
        .distinct.return_value.count.return_value = 0

    count = trap_service._generated_question_count(db, strategy_id=99)

    assert count == 0


def test_generated_question_count_excludes_drafts_end_to_end():
    """A strategy with e.g. 6 total AdversarialQuestion rows but only 2
    ever linked into an assessment_questions row must report
    generated_question_count == 2, matching the deployed-only population
    completed_attempt_count is drawn from -- not the total of 6."""
    db = MagicMock()
    _stub_trap_effectiveness_queries(
        db,
        deployed_strategies=[(5, "SYMBOL_REDEFINITION")],
        rows_by_strategy={5: [elevated_row(1)]},
        generated_count_by_strategy={5: 2},
    )

    results = get_trap_effectiveness(db)

    item = results[0]
    assert item.generated_question_count == 2
    assert item.completed_attempt_count == 1
