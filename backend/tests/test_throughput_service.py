from datetime import datetime, timedelta, timezone
from types import SimpleNamespace
from unittest.mock import MagicMock

import pytest

from app.services.assess_throughput import get_throughput


@pytest.fixture
def mock_db():
    return MagicMock()


def test_get_throughput_returns_expected_aggregates(mock_db):
    total_query = MagicMock()
    active_query = MagicMock()
    completed_query = MagicMock()
    expired_query = MagicMock()
    avg_time_query = MagicMock()
    avg_score_query = MagicMock()

    total_query.scalar.return_value = 6
    active_query.filter.return_value.scalar.return_value = 2
    completed_query.filter.return_value.scalar.return_value = 3
    expired_query.filter.return_value.scalar.return_value = 1
    avg_time_query.filter.return_value.scalar.return_value = 1800.5
    avg_score_query.filter.return_value.scalar.return_value = 84.25

    mock_db.query.side_effect = [
        total_query,
        active_query,
        completed_query,
        expired_query,
        avg_time_query,
        avg_score_query,
    ]

    result = get_throughput(mock_db)

    assert result.model_dump() == {
        "total_assessments": 6,
        "active_count": 2,
        "completed_count": 3,
        "expired_count": 1,
        "avg_time_to_completion_seconds": 1800.5,
        "avg_score": 84.25,
        "completion_rate": 0.75,
    }


def test_get_throughput_returns_none_averages_when_missing(mock_db):
    total_query = MagicMock()
    active_query = MagicMock()
    completed_query = MagicMock()
    expired_query = MagicMock()
    avg_time_query = MagicMock()
    avg_score_query = MagicMock()

    total_query.scalar.return_value = 0
    active_query.filter.return_value.scalar.return_value = 0
    completed_query.filter.return_value.scalar.return_value = 0
    expired_query.filter.return_value.scalar.return_value = 0
    avg_time_query.filter.return_value.scalar.return_value = None
    avg_score_query.filter.return_value.scalar.return_value = None

    mock_db.query.side_effect = [
        total_query,
        active_query,
        completed_query,
        expired_query,
        avg_time_query,
        avg_score_query,
    ]

    result = get_throughput(mock_db)

    assert result.model_dump() == {
        "total_assessments": 0,
        "active_count": 0,
        "completed_count": 0,
        "expired_count": 0,
        "avg_time_to_completion_seconds": None,
        "avg_score": None,
        "completion_rate": 0.0,
    }