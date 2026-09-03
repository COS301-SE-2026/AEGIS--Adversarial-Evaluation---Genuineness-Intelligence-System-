from unittest.mock import MagicMock

from app.services.user import get_all_candidates
from app.schema.user_management import UserRole
from app.services.user import (
    change_user_role,
    delete_user,
    list_users,
    update_user,
)

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


def _make_list_users_db(results):
    mock_db = MagicMock()
    query = mock_db.query.return_value

    query.join.return_value = query
    query.options.return_value = query
    query.order_by.return_value = query
    query.filter.return_value = query
    query.all.return_value = results

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


def _make_managed_user(
    user_id=1,
    email="user@example.com",
    full_name="Test User",
    role_name="CANDIDATE",
):
    mock_role = MagicMock()
    mock_role.role_name = role_name

    mock_user = MagicMock()
    mock_user.user_id = user_id
    mock_user.email = email
    mock_user.full_name = full_name
    mock_user.role = mock_role

    return mock_user


def test_list_users_returns_all_users():
    users = [
        _make_managed_user(
            user_id=1,
            email="candidate@example.com",
            full_name="Candidate User",
            role_name="CANDIDATE",
        ),
        _make_managed_user(
            user_id=2,
            email="recruiter@example.com",
            full_name="Recruiter User",
            role_name="RECRUITER",
        ),
    ]
    mock_db = _make_list_users_db(users)

    result = list_users(mock_db)

    assert result == users


def test_list_users_filters_by_search_term():
    matching_user = _make_managed_user(
        user_id=1,
        email="alice@example.com",
        full_name="Alice Smith",
    )
    mock_db = _make_list_users_db([matching_user])

    result = list_users(mock_db, search="alice")

    assert result == [matching_user]
    mock_db.query.return_value.filter.assert_called_once()


def test_change_user_role_updates_role():
    user = _make_managed_user(
        user_id=8,
        role_name="CANDIDATE",
    )
    role = MagicMock()
    role.role_id = 2
    role.role_name = "RECRUITER"

    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.side_effect = [
        user,
        role,
    ]

    result = change_user_role(
        mock_db,
        user_id=8,
        role_name=UserRole.RECRUITER,
    )

    assert user.user_role_id == 2
    assert result == user
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once_with(user)


def test_change_user_role_raises_when_user_does_not_exist():
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = None

    try:
        change_user_role(
            mock_db,
            user_id=999,
            role_name=UserRole.CANDIDATE,
        )
        assert False, "Expected ValueError"
    except ValueError as exc:
        assert str(exc) == "User not found"


def test_change_user_role_raises_when_role_does_not_exist():
    user = _make_managed_user(user_id=8)

    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.side_effect = [
        user,
        None,
    ]

    try:
        change_user_role(
            mock_db,
            user_id=8,
            role_name=UserRole.RECRUITER,
        )
        assert False, "Expected ValueError"
    except ValueError as exc:
        assert str(exc) == "Role RECRUITER does not exist"


def test_update_user_updates_email_and_full_name():
    user = _make_managed_user(user_id=8)
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = user

    result = update_user(
        mock_db,
        user_id=8,
        email="updated@example.com",
        full_name="Updated User",
    )

    assert user.email == "updated@example.com"
    assert user.full_name == "Updated User"
    assert result == user
    mock_db.commit.assert_called_once()
    mock_db.refresh.assert_called_once_with(user)


def test_update_user_raises_when_user_does_not_exist():
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = None

    try:
        update_user(
            mock_db,
            user_id=999,
            email="missing@example.com",
        )
        assert False, "Expected ValueError"
    except ValueError as exc:
        assert str(exc) == "User not found"


def test_delete_user_deletes_user_without_related_records():
    user = _make_managed_user(user_id=8)
    user.assessments = []
    user.sessions = []
    user.oauths = []

    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = user

    result = delete_user(mock_db, user_id=8)

    assert result is None
    mock_db.delete.assert_called_once_with(user)
    mock_db.commit.assert_called_once()


def test_delete_user_raises_when_user_does_not_exist():
    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = None

    try:
        delete_user(mock_db, user_id=999)
        assert False, "Expected ValueError"
    except ValueError as exc:
        assert str(exc) == "User not found"


def test_delete_user_raises_when_user_has_related_records():
    user = _make_managed_user(user_id=8)
    user.assessments = [MagicMock()]
    user.sessions = []
    user.oauths = []

    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = user

    try:
        delete_user(mock_db, user_id=8)
        assert False, "Expected ValueError"
    except ValueError as exc:
        assert str(exc) == (
            "This user cannot be deleted because they have related records"
        )

def test_delete_user_deletes_linked_oauth_records():
    oauth_record = MagicMock()
    user = _make_managed_user(user_id=8)
    user.assessments = []
    user.sessions = []
    user.oauths = [oauth_record]

    mock_db = MagicMock()
    mock_db.query.return_value.filter.return_value.first.return_value = user

    result = delete_user(mock_db, user_id=8)

    assert result is None
    mock_db.delete.assert_any_call(oauth_record)
    mock_db.delete.assert_any_call(user)
    assert mock_db.delete.call_count == 2
    mock_db.commit.assert_called_once()