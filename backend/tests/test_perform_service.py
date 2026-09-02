from types import SimpleNamespace
from unittest.mock import MagicMock
import pytest
from app.services.reporting_performance_breakdown import (
    get_performance_breakdown,
)


@pytest.fixture
def mock_db():
    return MagicMock()


def _stub_query_rows(mock_db, rows):
    query = MagicMock()
    mock_db.query.return_value = query
    query.join.return_value.join.return_value.join.return_value.outerjoin.return_value.group_by.return_value.order_by.return_value.all.return_value = rows
    return query


def test_get_performance_breakdown_by_category_maps_rows(mock_db):
    rows = [
        SimpleNamespace(
            label="Algorithms",
            attempt_count=8,
            avg_success_rate=0.625,
        ),
        SimpleNamespace(
            label="Frontend",
            attempt_count=4,
            avg_success_rate=0.25,
        ),
    ]
    _stub_query_rows(mock_db, rows)

    result = get_performance_breakdown(mock_db, by="category")

    assert result.model_dump() == {
        "by": "category",
        "slices": [
            {
                "label": "Algorithms",
                "avg_success_rate": 0.625,
                "attempt_count": 8,
            },
            {
                "label": "Frontend",
                "avg_success_rate": 0.25,
                "attempt_count": 4,
            },
        ],
    }


def test_get_performance_breakdown_by_difficulty_maps_rows(mock_db):
    rows = [
        SimpleNamespace(
            label="Easy",
            attempt_count=10,
            avg_success_rate=0.8,
        ),
        SimpleNamespace(
            label="Hard",
            attempt_count=5,
            avg_success_rate=0.2,
        ),
    ]
    _stub_query_rows(mock_db, rows)

    result = get_performance_breakdown(mock_db, by="difficulty")

    assert result.model_dump() == {
        "by": "difficulty",
        "slices": [
            {
                "label": "Easy",
                "avg_success_rate": 0.8,
                "attempt_count": 10,
            },
            {
                "label": "Hard",
                "avg_success_rate": 0.2,
                "attempt_count": 5,
            },
        ],
    }


def test_get_performance_breakdown_defaults_none_values_to_zero(mock_db):
    rows = [
        SimpleNamespace(
            label="Uncategorised",
            attempt_count=None,
            avg_success_rate=None,
        ),
    ]
    _stub_query_rows(mock_db, rows)

    result = get_performance_breakdown(mock_db, by="category")

    assert result.model_dump() == {
        "by": "category",
        "slices": [
            {
                "label": "Uncategorised",
                "avg_success_rate": 0.0,
                "attempt_count": 0,
            }
        ],
    }