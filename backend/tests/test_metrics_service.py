from unittest.mock import MagicMock

import pytest
from fastapi import HTTPException

from app.models.candidate_response_metrics import CandidateResponseMetrics
from app.models.candidate_assessment import CandidateAssessment
from app.services import metrics as metrics_service


def make_metrics_row(**overrides):
    values = {
        "candidate_response_id": 7,
        "candidate_assessment_id": 12,
        "active_time_ms": 100000,
        "unique_keys_count": 27,
        "chars_alnum": 41,
        "chars_special": 44,
        "backspace_count": 33,
        "copy_event_count": 12,
        "copy_char_count": 88,
        "paste_event_count": 24,
        "paste_char_count": 344,
        "focus_loss_count": 2,
        "focus_loss_time_ms": 2899,
    }
    values.update(overrides)
    return CandidateResponseMetrics(**values)


def test_get_metrics_for_response_queries_database():
    row = make_metrics_row()
    query = MagicMock()
    query.filter.return_value.first.return_value = row

    db = MagicMock()
    db.query.return_value = query

    result = metrics_service.get_metrics_for_response(db, 7)

    db.query.assert_called_once_with(CandidateResponseMetrics)
    query.filter.assert_called_once()
    assert result.candidate_response_id == 7
    assert result.active_time_ms == 100000
    assert result.paste_char_count == 344
    assert result.copy_char_count == 88


def test_get_metrics_for_response_raises_when_missing():
    query = MagicMock()
    query.filter.return_value.first.return_value = None

    db = MagicMock()
    db.query.return_value = query

    with pytest.raises(HTTPException) as error:
        metrics_service.get_metrics_for_response(db, 7)

    assert error.value.status_code == 404


def _stub_assessment_and_metrics_queries(mock_db, rows, session):
    metrics_query = MagicMock(**{
        "filter.return_value.order_by.return_value.all.return_value": rows,
    })
    session_query = MagicMock(**{
        "filter.return_value.first.return_value": session,
    })

    mock_db.query.side_effect = [metrics_query, session_query]


def test_get_metrics_for_assessment_filters_rows():
    rows = [
        make_metrics_row(
            candidate_response_id=1,
            candidate_assessment_id=12,
        ),
        make_metrics_row(
            candidate_response_id=2,
            candidate_assessment_id=12,
            focus_loss_count=4,
        ),
    ]
    session = CandidateAssessment(
        candidate_assess_id=12,
        behavioral_summary="Candidate typed steadily throughout.",
    )

    db = MagicMock()
    _stub_assessment_and_metrics_queries(db, rows, session)

    result = metrics_service.get_metrics_for_assessment(db, 12)

    assert [item.candidate_response_id for item in result.metrics] == [1, 2]
    assert result.metrics[1].focus_loss_count == 4
    assert result.behavioral_summary == (
        "Candidate typed steadily throughout."
    )


def test_get_metrics_for_assessment_summary_none_when_not_generated():
    session = CandidateAssessment(
        candidate_assess_id=12,
        behavioral_summary=None,
    )

    db = MagicMock()
    _stub_assessment_and_metrics_queries(db, [], session)

    result = metrics_service.get_metrics_for_assessment(db, 12)

    assert result.metrics == []
    assert result.behavioral_summary is None


def test_get_metrics_for_assessment_summary_none_when_session_missing():
    db = MagicMock()
    _stub_assessment_and_metrics_queries(db, [], None)

    result = metrics_service.get_metrics_for_assessment(db, 999)

    assert result.metrics == []
    assert result.behavioral_summary is None
