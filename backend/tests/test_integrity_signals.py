from types import SimpleNamespace
from app.services.integrity_signals import get_integrity_summary


def test_get_integrity_summary_returns_expected_aggregates():
    rows = [
        SimpleNamespace(
            candidate_assessment_id=1,
            chars_alnum=100,
            paste_char_count=80,
            focus_loss_count=2,
            focus_loss_time_ms=20000,
        ),
        SimpleNamespace(
            candidate_assessment_id=1,
            chars_alnum=80,
            paste_char_count=20,
            focus_loss_count=4,
            focus_loss_time_ms=70000,
        ),
        SimpleNamespace(
            candidate_assessment_id=2,
            chars_alnum=50,
            paste_char_count=10,
            focus_loss_count=1,
            focus_loss_time_ms=1000,
        ),
    ]

    class FakeQuery:
        def __init__(self, rows):
            self._rows = rows

        def all(self):
            return self._rows

    class FakeDB:
        def query(self, model):
            return FakeQuery(rows)

    db = FakeDB()

    result = get_integrity_summary(db)

    assert result.model_dump() == {
        "pct_responses_elevated_paste_reliance": 0.3333,
        "pct_assessments_with_elevated_review": 0.5,
        "avg_focus_loss_count": 2.3333,
        "total_responses_analyzed": 3,
    }