from app.schema.trap_effectiveness import TrapEffectivenessItem
from app.services import trap_effectiveness as trap_service
from app.services.trap_effectiveness import get_trap_recommendations


def _item(
    trap_id,
    evidence_status,
    review_signal_rate=None,
    completed_attempt_count=0,
):
    return TrapEffectivenessItem(
        trap_id=trap_id,
        trap_name=f"STRATEGY_{trap_id}",
        generated_question_count=1,
        completed_attempt_count=completed_attempt_count,
        elevated_review_count=0,
        review_signal_rate=review_signal_rate,
        evidence_status=evidence_status,
    )


def test_single_sufficient_strategy_is_recommended(monkeypatch):
    items = [
        _item(
            1, "SUFFICIENT_DATA",
            review_signal_rate=60.0, completed_attempt_count=10,
        ),
        _item(
            2, "INSUFFICIENT_DATA",
            review_signal_rate=90.0, completed_attempt_count=2,
        ),
        _item(3, "NO_DATA"),
    ]
    monkeypatch.setattr(
        trap_service, "get_trap_effectiveness", lambda db: items,
    )

    results = get_trap_recommendations(db=None)

    by_id = {r.trap_id: r for r in results}

    assert by_id[1].recommendation_available is True
    assert by_id[1].recommendation is not None
    assert "10 completed attempts" in by_id[1].recommendation
    assert "60.0%" in by_id[1].recommendation
    assert by_id[1].reason == (
        "Highest review-signal rate among strategies with sufficient data."
    )
    assert by_id[1].evidence_status == "SUFFICIENT_DATA"

    assert by_id[2].recommendation_available is False
    assert by_id[2].recommendation is None
    assert by_id[2].reason is None
    assert by_id[2].evidence_status == "INSUFFICIENT_DATA"

    assert by_id[3].recommendation_available is False
    assert by_id[3].recommendation is None
    assert by_id[3].reason is None
    assert by_id[3].evidence_status == "NO_DATA"


def test_highest_review_signal_rate_wins_among_sufficient(monkeypatch):
    items = [
        _item(
            1, "SUFFICIENT_DATA",
            review_signal_rate=40.0, completed_attempt_count=8,
        ),
        _item(
            2, "SUFFICIENT_DATA",
            review_signal_rate=75.5, completed_attempt_count=12,
        ),
        _item(
            3, "SUFFICIENT_DATA",
            review_signal_rate=55.0, completed_attempt_count=6,
        ),
    ]
    monkeypatch.setattr(
        trap_service, "get_trap_effectiveness", lambda db: items,
    )

    results = get_trap_recommendations(db=None)
    recommended = [r for r in results if r.recommendation_available]

    assert len(recommended) == 1
    assert recommended[0].trap_id == 2
    assert "75.5%" in recommended[0].recommendation


def test_no_sufficient_data_strategies_yields_no_recommendation(monkeypatch):
    items = [
        _item(1, "NO_DATA"),
        _item(
            2, "INSUFFICIENT_DATA",
            review_signal_rate=100.0, completed_attempt_count=1,
        ),
    ]
    monkeypatch.setattr(
        trap_service, "get_trap_effectiveness", lambda db: items,
    )

    results = get_trap_recommendations(db=None)

    assert len(results) == 2
    assert all(not r.recommendation_available for r in results)
    assert all(r.recommendation is None for r in results)
    assert all(r.reason is None for r in results)


def test_empty_effectiveness_list_yields_empty_recommendations(monkeypatch):
    monkeypatch.setattr(
        trap_service, "get_trap_effectiveness", lambda db: [],
    )

    results = get_trap_recommendations(db=None)

    assert results == []


def test_tied_review_signal_rate_breaks_by_lowest_trap_id(monkeypatch):
    """The spec does not define a tie-break rule; this locks in the
    resolution used here -- lowest trap_id wins on an exact tie -- so the
    endpoint's output is stable and reproducible run to run."""
    items = [
        _item(
            5, "SUFFICIENT_DATA",
            review_signal_rate=50.0, completed_attempt_count=10,
        ),
        _item(
            2, "SUFFICIENT_DATA",
            review_signal_rate=50.0, completed_attempt_count=10,
        ),
        _item(
            9, "SUFFICIENT_DATA",
            review_signal_rate=50.0, completed_attempt_count=10,
        ),
    ]
    monkeypatch.setattr(
        trap_service, "get_trap_effectiveness", lambda db: items,
    )

    results = get_trap_recommendations(db=None)
    recommended = [r for r in results if r.recommendation_available]

    assert len(recommended) == 1
    assert recommended[0].trap_id == 2
