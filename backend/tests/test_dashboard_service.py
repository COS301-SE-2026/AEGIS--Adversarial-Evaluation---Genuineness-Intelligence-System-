from unittest.mock import MagicMock

from app.schema.dashboard import AIUsageLevel, TopPerformer
from app.services import dashboard as dashboard_service


def _make_query(rows=None, *, count_value=0, scalar_value=0):
    query = MagicMock()
    query.join.return_value = query
    query.filter.return_value = query
    query.order_by.return_value = query
    query.limit.return_value = query
    query.all.return_value = rows or []
    query.count.return_value = count_value
    query.scalar.return_value = scalar_value
    return query


def test_get_top_performers_returns_ranked_results():
    row = MagicMock()
    row.candidate_name = "Alice"
    row.score_percent = 92.5

    mock_db = MagicMock()
    mock_db.query.return_value = _make_query([row])

    result = dashboard_service._get_top_performers(mock_db, 7)

    assert len(result) == 1
    assert result[0].candidate_name == "Alice"
    assert result[0].score_percent == 92.5


def test_get_total_assessments_returns_count():
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.count.return_value = 4

    result = dashboard_service._get_total_assessments(mock_db, 7)

    assert result == 4


def test_get_ai_usage_rate_returns_high_level_when_threshold_met():
    mock_db = MagicMock()
    mock_db.query.side_effect = [
        _make_query(count_value=10),
        _make_query(scalar_value=7),
    ]

    result = dashboard_service._get_ai_usage_rate(mock_db, 7)

    assert result.level == AIUsageLevel.HIGH
    assert result.percent == 70.0


def test_get_dashboard_summary_builds_response(monkeypatch):
    monkeypatch.setattr(
        dashboard_service,
        "_get_top_performers",
        lambda db, recruiter_id: [
            TopPerformer(candidate_name="Bob", score_percent=88.0)
        ],
    )
    monkeypatch.setattr(
        dashboard_service,
        "_get_total_assessments",
        lambda db, recruiter_id: 9,
    )
    monkeypatch.setattr(
        dashboard_service,
        "_get_ai_usage_rate",
        lambda db, recruiter_id: dashboard_service.AIUsageRate(
            level=AIUsageLevel.MEDIUM,
            percent=40.0,
        ),
    )

    result = dashboard_service.get_dashboard_summary(MagicMock(), 7)

    assert result.total_assessments == 9
    assert result.top_performers[0].candidate_name == "Bob"
    assert result.ai_usage_rate.level == AIUsageLevel.MEDIUM
    assert result.ai_usage_rate.percent == 40.0