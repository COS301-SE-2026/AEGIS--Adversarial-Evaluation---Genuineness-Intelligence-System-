from unittest.mock import MagicMock

from app.services.user import get_all_candidates


def _make_mock_db(results):
    mock_db = MagicMock()
    (
        mock_db.query.return_value
        .join.return_value
        .filter.return_value
        .options.return_value
        .all.return_value
    ) = results
    return mock_db


def test_get_all_candidates_returns_empty_list_when_no_candidates():
    mock_db = _make_mock_db([])
    result = get_all_candidates(mock_db)
    assert result == []


def test_get_all_candidates_returns_only_candidate_role_users():
    mock_role = MagicMock()
    mock_role.role_name = "CANDIDATE"

    mock_user = MagicMock()
    mock_user.user_id = 1
    mock_user.email = "candidate@example.com"
    mock_user.full_name = "Test Candidate"
    mock_user.role = mock_role

    mock_db = _make_mock_db([mock_user])
    result = get_all_candidates(mock_db)

    assert len(result) == 1
    assert result[0].role.role_name == "CANDIDATE"


def test_get_all_candidates_does_not_return_recruiter_users():
    mock_db = _make_mock_db([])
    result = get_all_candidates(mock_db)
    assert all(getattr(u.role, "role_name", None) != "RECRUITER" for u in result)


def test_get_all_candidates_items_have_required_fields():
    mock_role = MagicMock()
    mock_role.role_name = "CANDIDATE"

    mock_user = MagicMock()
    mock_user.user_id = 7
    mock_user.email = "alice@example.com"
    mock_user.full_name = "Alice Smith"
    mock_user.role = mock_role

    mock_db = _make_mock_db([mock_user])
    result = get_all_candidates(mock_db)

    assert len(result) == 1
    u = result[0]
    assert u.user_id == 7
    assert u.email == "alice@example.com"
    assert u.full_name == "Alice Smith"
