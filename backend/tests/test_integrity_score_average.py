from decimal import Decimal
from unittest.mock import MagicMock

import pytest

from app.services.integrity_score_average import get_integrity_score_average

RECRUITER_ID = 7


def _chain(query, value):
    query.join.return_value.filter.return_value.scalar.return_value = value


@pytest.fixture
def mock_db():
    return MagicMock()


def test_returns_flat_average_over_scored_candidates(mock_db):
    count_query = MagicMock()
    avg_query = MagicMock()

    _chain(count_query, 3)
    _chain(avg_query, Decimal("61.0"))

    mock_db.query.side_effect = [count_query, avg_query]

    result = get_integrity_score_average(mock_db, RECRUITER_ID)

    assert result.model_dump() == {
        "average_integrity_score": 61,
        "scored_candidate_count": 3,
    }


def test_unscored_candidates_do_not_drag_average_toward_zero(mock_db):
    count_query = MagicMock()
    avg_query = MagicMock()

    # Two of the recruiter's candidates scored 80 and 90; several
    # others have NULL integrity_score. The SQL AVG + IS NOT NULL
    # filter yields 85, not (80 + 90) / (2 + unscored).
    _chain(count_query, 2)
    _chain(avg_query, Decimal("85.0"))

    mock_db.query.side_effect = [count_query, avg_query]

    result = get_integrity_score_average(mock_db, RECRUITER_ID)

    assert result.average_integrity_score == 85
    assert result.scored_candidate_count == 2


def test_average_is_rounded_to_nearest_whole_number(mock_db):
    count_query = MagicMock()
    avg_query = MagicMock()

    _chain(count_query, 4)
    _chain(avg_query, Decimal("42.5"))

    mock_db.query.side_effect = [count_query, avg_query]

    result = get_integrity_score_average(mock_db, RECRUITER_ID)

    assert result.average_integrity_score == 43


def test_all_null_returns_none_not_zero(mock_db):
    count_query = MagicMock()
    avg_query = MagicMock()

    _chain(count_query, 0)
    _chain(avg_query, None)

    mock_db.query.side_effect = [count_query, avg_query]

    result = get_integrity_score_average(mock_db, RECRUITER_ID)

    assert result.model_dump() == {
        "average_integrity_score": None,
        "scored_candidate_count": 0,
    }
