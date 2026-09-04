from unittest.mock import MagicMock
import pytest
from fastapi import HTTPException

from app.schema.dashboard import (
    AIUsageLevel,
    TopPerformer,
    AverageScore,
    DashboardGraphResponse,
    TableItem,
    DashboardTableResponse,
    AssessmentDetailTableResponse,
    FilterableTableItem,
    QuestionQualityResponse,
)
from app.services import dashboard as dashboard_service
from app.services.assessment_report import get_question_quality, build_question_quality_guidance


def _make_query(rows=None, *, count_value=0, scalar_value=0):
    query = MagicMock()
    query.join.return_value = query
    query.outerjoin.return_value = query
    query.having.return_value = query
    query.filter.return_value = query
    query.group_by.return_value = query
    query.order_by.return_value = query
    query.offset.return_value = query
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
            AverageScore(
                assessment_name="Assessment A",
                average_score=81.5,
            ),
            AverageScore(
                assessment_name="Assessment B",
                average_score=92.0,
            ),
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

    result = dashboard_service._get_table_items(
        mock_db,
        7,
        page=1,
        page_size=8,
    )

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

    result = dashboard_service._get_table_items(
        mock_db,
        7,
        page=1,
        page_size=8,
    )

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


def test_get_assessment_card_details_with_no_performers():
    assessment = MagicMock()
    assessment.title = "New Assessment"

    mock_db = MagicMock()
    mock_query = MagicMock()

    mock_db.query.return_value = mock_query
    mock_query.filter.return_value = mock_query
    mock_query.join.return_value = mock_query
    mock_query.order_by.return_value = mock_query
    mock_query.limit.return_value = mock_query
    mock_query.all.return_value = []
    mock_query.filter.return_value.first.return_value = assessment
    mock_query.scalar.side_effect = [None, None]
    mock_query.count.return_value = 0

    result = dashboard_service._get_assessment_card_details(
        mock_db,
        1,
    )

    assert result.assessment_id == 1
    assert result.assessment_name == "New Assessment"
    assert result.top_performers == []
    assert result.average_total_percent == 0.0
    assert result.average_completion_time == 0.0
    assert result.ai_usage.percent == 0.0
    assert result.ai_usage.level == AIUsageLevel.LOW


def test_get_assessment_card_details_ai_usage_level_low():
    assessment = MagicMock()
    assessment.title = "Test Assessment"

    mock_db = MagicMock()
    mock_query = MagicMock()

    mock_db.query.return_value = mock_query
    mock_query.filter.return_value = mock_query
    mock_query.join.return_value = mock_query
    mock_query.order_by.return_value = mock_query
    mock_query.limit.return_value = mock_query
    mock_query.all.return_value = []
    mock_query.filter.return_value.first.return_value = assessment
    mock_query.scalar.side_effect = [50.0, 1200.0]
    mock_query.count.side_effect = [2, 10]

    result = dashboard_service._get_assessment_card_details(
        mock_db,
        1,
    )

    assert result.ai_usage.level == AIUsageLevel.LOW
    assert result.ai_usage.percent == 20.0


def test_get_assessment_card_details_ai_usage_level_medium():
    assessment = MagicMock()
    assessment.title = "Test Assessment"

    mock_db = MagicMock()
    mock_query = MagicMock()

    mock_db.query.return_value = mock_query
    mock_query.filter.return_value = mock_query
    mock_query.join.return_value = mock_query
    mock_query.order_by.return_value = mock_query
    mock_query.limit.return_value = mock_query
    mock_query.all.return_value = []
    mock_query.filter.return_value.first.return_value = assessment
    mock_query.scalar.side_effect = [60.0, 1200.0]
    mock_query.count.side_effect = [5, 10]

    result = dashboard_service._get_assessment_card_details(
        mock_db,
        1,
    )

    assert result.ai_usage.level == AIUsageLevel.MEDIUM
    assert result.ai_usage.percent == 50.0


def test_get_assessment_card_details_ai_usage_level_high():
    assessment = MagicMock()
    assessment.title = "Test Assessment"

    mock_db = MagicMock()
    mock_query = MagicMock()

    mock_db.query.return_value = mock_query
    mock_query.filter.return_value = mock_query
    mock_query.join.return_value = mock_query
    mock_query.order_by.return_value = mock_query
    mock_query.limit.return_value = mock_query
    mock_query.all.return_value = []
    mock_query.filter.return_value.first.return_value = assessment
    mock_query.scalar.side_effect = [75.0, 1200.0]
    mock_query.count.side_effect = [7, 10]

    result = dashboard_service._get_assessment_card_details(
        mock_db,
        1,
    )

    assert result.ai_usage.level == AIUsageLevel.HIGH
    assert result.ai_usage.percent == 70.0


def test_get_assessment_detail_cards_service_function():
    assessment = MagicMock()
    assessment.title = "Test Assessment"

    mock_db = MagicMock()
    mock_query = MagicMock()

    mock_db.query.return_value = mock_query
    mock_query.filter.return_value = mock_query
    mock_query.join.return_value = mock_query
    mock_query.order_by.return_value = mock_query
    mock_query.limit.return_value = mock_query
    mock_query.all.return_value = []
    mock_query.filter.return_value.first.return_value = assessment
    mock_query.scalar.side_effect = [85.0, 1500.0]
    mock_query.count.return_value = 0

    result = dashboard_service.get_assessment_detail_cards(
        assessment_id=42,
        db=mock_db,
    )

    assert isinstance(
        result,
        dashboard_service.AssessmentDetailCardResponse,
    )
    assert result.assessment_id == 42
    assert result.assessment_name == "Test Assessment"


def test_get_assessment_detail_table_items_returns_candidate_rows():
    row = MagicMock()
    row.candidate_id = 12
    row.candidate_name = "Alice"
    row.total_score_percent = 87.456
    row.status = "PASS"
    row.ai_rating_percent = 91.234
    row.integrity_score = 72
    row.integrity_band = "high"

    mock_db = MagicMock()
    mock_db.query.return_value = _make_query([row])

    result = dashboard_service._get_assessment_detail_table_items(
        db=mock_db,
        assessment_id=101,
        status=None,
        search=None,
        page=1,
        page_size=8,
    )

    assert isinstance(result, AssessmentDetailTableResponse)
    assert result.page == 1
    assert result.page_size == 8
    assert len(result.items) == 1

    item = result.items[0]
    assert isinstance(item, FilterableTableItem)
    assert item.candidate_id == 12
    assert item.candidate_name == "Alice"
    assert item.total_score_percent == 87.46
    assert item.status == "PASS"
    assert item.ai_rating_percent == 91.23
    assert item.integrity_score == 72
    assert item.integrity_band == "high"


def test_get_assessment_detail_table_items_reads_stored_integrity_snapshot():
    row = MagicMock()
    row.candidate_id = 5
    row.candidate_name = "Bob"
    row.total_score_percent = 40.0
    row.status = "FAIL"
    row.ai_rating_percent = 0.0
    row.integrity_score = 18
    row.integrity_band = "low"

    mock_db = MagicMock()
    mock_db.query.return_value = _make_query([row])

    result = dashboard_service._get_assessment_detail_table_items(
        db=mock_db,
        assessment_id=101,
        status=None,
        search=None,
        page=1,
        page_size=8,
    )

    item = result.items[0]
    assert item.integrity_score == 18
    assert item.integrity_band == "low"


def test_get_assessment_detail_table_items_handles_null_integrity_snapshot():
    row = MagicMock()
    row.candidate_id = 9
    row.candidate_name = "Carol"
    row.total_score_percent = 61.0
    row.status = "PASS"
    row.ai_rating_percent = 0.0
    row.integrity_score = None
    row.integrity_band = None

    mock_db = MagicMock()
    mock_db.query.return_value = _make_query([row])

    result = dashboard_service._get_assessment_detail_table_items(
        db=mock_db,
        assessment_id=101,
        status=None,
        search=None,
        page=1,
        page_size=8,
    )

    item = result.items[0]
    assert item.integrity_score is None
    assert item.integrity_band is None


def test_get_assessment_detail_table_items_returns_empty_list():
    mock_db = MagicMock()
    mock_db.query.return_value = _make_query([])

    result = dashboard_service._get_assessment_detail_table_items(
        db=mock_db,
        assessment_id=101,
        status=None,
        search=None,
        page=1,
        page_size=8,
    )

    assert result.items == []
    assert result.page == 1
    assert result.page_size == 8


def test_get_assessment_detail_table_items_supports_filters_and_pagination():
    row = MagicMock()
    row.candidate_id = 12
    row.candidate_name = "Alice"
    row.total_score_percent = 55.0
    row.status = "PASS"
    row.ai_rating_percent = 80.0
    row.integrity_score = 50
    row.integrity_band = "medium"

    mock_db = MagicMock()
    query = _make_query([row])
    mock_db.query.return_value = query

    result = dashboard_service._get_assessment_detail_table_items(
        db=mock_db,
        assessment_id=101,
        status="pass",
        search="alice",
        page=2,
        page_size=4,
    )

    assert result.items[0].status == "PASS"
    query.offset.assert_called_once_with(4)
    query.limit.assert_called_once_with(4)
    query.having.assert_called_once()


def test_get_assessment_detail_table_info_delegates_to_helper(monkeypatch):
    expected = AssessmentDetailTableResponse(
        items=[],
        page=2,
        page_size=4,
    )

    helper = MagicMock(return_value=expected)
    monkeypatch.setattr(
        dashboard_service,
        "_get_assessment_detail_table_items",
        helper,
    )

    result = dashboard_service.get_assessment_detail_table_info(
        db=MagicMock(),
        assessment_id=101,
        status="FAIL",
        search="bob",
        page=2,
        page_size=4,
    )

    assert result is expected
    helper.assert_called_once_with(
        db=helper.call_args.kwargs["db"],
        assessment_id=101,
        status="FAIL",
        search="bob",
        page=2,
        page_size=4,
    )


def test_get_assessment_card_details_raises_404_when_assessment_not_found():
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = None

    with pytest.raises(HTTPException) as exc_info:
        dashboard_service._get_assessment_card_details(
            db=mock_db,
            assessment_id=999,
        )

    assert exc_info.value.status_code == 404
    assert exc_info.value.detail == "Assessment not found"

def test_get_question_quality_groups_generated_questions_by_bucket():
    row_1 = MagicMock()
    row_1.adversarial_question_id = 101
    row_1.attempt_count = 2
    row_1.correct_count = 1

    row_2 = MagicMock()
    row_2.adversarial_question_id = 102
    row_2.attempt_count = 5
    row_2.correct_count = 4

    row_3 = MagicMock()
    row_3.adversarial_question_id = 103
    row_3.attempt_count = 20
    row_3.correct_count = 20

    row_4 = MagicMock()
    row_4.adversarial_question_id = 104
    row_4.attempt_count = 5
    row_4.correct_count = 1

    mock_db = MagicMock()
    mock_db.query.return_value = MagicMock()
    mock_db.query.return_value.join.return_value = mock_db.query.return_value
    mock_db.query.return_value.outerjoin.return_value = (
        mock_db.query.return_value
    )
    mock_db.query.return_value.group_by.return_value = (
        mock_db.query.return_value
    )
    mock_db.query.return_value.all.return_value = [row_1, row_2, row_3, row_4]
    result = get_question_quality(mock_db)
    assert isinstance(result, QuestionQualityResponse)
    assert result.total_questions_answered == 4
    assert result.buckets[0].bucket == "needs_revision"
    assert result.buckets[0].question_ids == [104]
    assert result.buckets[1].bucket == "balanced"
    assert result.buckets[1].question_ids == [102]
    assert result.buckets[2].bucket == "too_easy"
    assert result.buckets[2].question_ids == [103]
    assert result.buckets[3].bucket == "thin_sample"
    assert result.buckets[3].question_ids == [101]
    assert "below 30% success" in result.guidance[0]
    assert "balanced range" in result.guidance[1]
    assert "above 95% success" in result.guidance[2]
    assert "fewer than 3 attempts" in result.guidance[3]


def test_build_question_quality_guidance_skips_empty_bucket():
    bucket = MagicMock()
    bucket.count = 0
    bucket.bucket = "needs_revision"

    result = build_question_quality_guidance([bucket])

    assert result == []


def test_build_question_quality_guidance_handles_unknown_bucket():
    bucket = MagicMock()
    bucket.count = 1
    bucket.bucket = "unknown"

    result = build_question_quality_guidance([bucket])

    assert result == []
