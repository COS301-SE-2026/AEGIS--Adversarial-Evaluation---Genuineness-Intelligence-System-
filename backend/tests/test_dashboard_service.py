from unittest.mock import MagicMock

from app.schema.dashboard import (
    AIUsageLevel,
    TopPerformer,
    AverageScore,
    DashboardGraphResponse,
    TableItem,
    DashboardTableResponse
)
from app.services import dashboard as dashboard_service


def _make_query(rows=None, *, count_value=0, scalar_value=0):
    query = MagicMock()
    query.join.return_value = query
    query.filter.return_value = query
    query.group_by.return_value = query
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

def test_get_average_score_per_assessment_returns_values():
    row = MagicMock()
    row.assessment_name = "Assessment A"
    row.average_score_percent = 88.5

    mock_db = MagicMock()
    mock_db.query.return_value = _make_query([row])

    result = dashboard_service._get_average_score_per_assessment(mock_db, 7)

    assert len(result) == 1
    assert result[0].assessment_name == "Assessment A"
    assert result[0].average_score == 88.5

def test_get_average_score_per_assessment_returns_empty_list():
    mock_db = MagicMock()
    mock_db.query.return_value = _make_query([])

    result = dashboard_service._get_average_score_per_assessment(mock_db, 7)

    assert result == []

def test_get_graph_values_wraps_bars(monkeypatch):
    monkeypatch.setattr(
        dashboard_service,
        "_get_average_score_per_assessment",
        lambda db, recruiter_id: [
            AverageScore(assessment_name="Assessment A", average_score=81.5),
            AverageScore(assessment_name="Assessment B", average_score=92.0),
        ],
    )

    result = dashboard_service.get_graph_values(MagicMock(), 7)

    assert isinstance(result, DashboardGraphResponse)
    assert len(result.bars) == 2
    assert result.bars[0].assessment_name == "Assessment A"
    assert result.bars[1].average_score == 92.0


def test_get_table_items_returns_paginated_items():
    row = MagicMock()
    row.assessment_id = 101
    row.name = "Python Assessment"
    row.average_score_percent = 87.456
    row.top_candidate_name = "Alice"

    mock_db = MagicMock()
    mock_db.query.return_value = MagicMock()
    mock_db.query.return_value.join.return_value = mock_db.query.return_value
    mock_db.query.return_value.filter.return_value = mock_db.query.return_value
    mock_db.query.return_value.group_by.return_value = mock_db.query.return_value
    mock_db.query.return_value.order_by.return_value = mock_db.query.return_value
    mock_db.query.return_value.offset.return_value = mock_db.query.return_value
    mock_db.query.return_value.limit.return_value = mock_db.query.return_value
    mock_db.query.return_value.all.return_value = [row]

    result = dashboard_service._get_table_items(mock_db, 7, page=1, page_size=8)

    assert len(result) == 1
    assert result[0].assessment_id == 101
    assert result[0].name == "Python Assessment"
    assert result[0].average_score_percent == 87.46
    assert result[0].top_candidate_name == "Alice"


def test_get_table_items_returns_empty_list_when_no_rows():
    mock_db = MagicMock()
    mock_db.query.return_value = MagicMock()
    mock_db.query.return_value.join.return_value = mock_db.query.return_value
    mock_db.query.return_value.filter.return_value = mock_db.query.return_value
    mock_db.query.return_value.group_by.return_value = mock_db.query.return_value
    mock_db.query.return_value.order_by.return_value = mock_db.query.return_value
    mock_db.query.return_value.offset.return_value = mock_db.query.return_value
    mock_db.query.return_value.limit.return_value = mock_db.query.return_value
    mock_db.query.return_value.all.return_value = []

    result = dashboard_service._get_table_items(mock_db, 7, page=1, page_size=8)

    assert result == []


def test_get_assessment_summary_builds_table_response(monkeypatch):
    monkeypatch.setattr(
        dashboard_service,
        "_get_table_items",
        lambda db, recruiter_id, page, page_size: [
            TableItem(
                assessment_id=101,
                name="Python Assessment",
                average_score_percent=88.5,
                top_candidate_name="Alice",
            )
        ],
    )

    result = dashboard_service.get_assessment_summary(
        recruiter_id=7,
        db=MagicMock(),
        page=1,
        page_size=8,
    )

    assert isinstance(result, DashboardTableResponse)
    assert result.page == 1
    assert result.page_size == 8
    assert result.items[0].assessment_id == 101
    assert result.items[0].name == "Python Assessment"
    assert result.items[0].average_score_percent == 88.5
