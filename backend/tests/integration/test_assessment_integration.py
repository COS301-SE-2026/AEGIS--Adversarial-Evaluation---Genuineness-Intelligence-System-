import pytest
from sqlalchemy import event

from app.models import (
    Assessment,
    CandidateAssessment,
    QuestionCategory,
    Role,
    SessionStatus,
    User,
)
from app.services.assessment import get_all_assessments

pytestmark = pytest.mark.integration


def _make_role(db, name):
    role = Role(role_name=name)
    db.add(role)
    db.flush()
    return role


def _make_user(db, role, email):
    user = User(
        email=email,
        full_name="Integration Test User",
        user_role_id=role.role_id,
    )
    db.add(user)
    db.flush()
    return user


def _make_category(db, name):
    category = QuestionCategory(category_name=name)
    db.add(category)
    db.flush()
    return category


def _make_assessment(db, creator, title):
    assessment = Assessment(
        title=title,
        duration_mins=30,
        creator_id=creator.user_id,
    )
    db.add(assessment)
    db.flush()
    return assessment


def _make_session(db, assessment, candidate, status):
    session = CandidateAssessment(
        status=status,
        access_token=f"token-{assessment.assessment_id}-{candidate.user_id}",
        candidate_id=candidate.user_id,
        assessment_id=assessment.assessment_id,
    )
    db.add(session)
    db.flush()
    return session


def _count_queries(db_session, fn):
    queries = []

    def _before_execute(conn, cursor, statement, params, context, executemany):
        queries.append(statement)

    engine = db_session.get_bind()
    event.listen(engine, "before_cursor_execute", _before_execute)
    try:
        result = fn()
    finally:
        event.remove(engine, "before_cursor_execute", _before_execute)
    return result, queries


def test_get_all_assessments_does_not_n_plus_one_on_sessions(db_session):
    recruiter_role = _make_role(db_session, "RECRUITER")
    candidate_role = _make_role(db_session, "CANDIDATE")
    recruiter = _make_user(
        db_session, recruiter_role, "recruiter-nplus1@example.com"
    )
    candidate_one = _make_user(
        db_session, candidate_role, "candidate-one-nplus1@example.com"
    )
    candidate_two = _make_user(
        db_session, candidate_role, "candidate-two-nplus1@example.com"
    )

    assessments = [
        _make_assessment(db_session, recruiter, f"N+1 guard assessment {i}")
        for i in range(5)
    ]

    for assessment in assessments:
        _make_session(
            db_session, assessment, candidate_one, SessionStatus.COMPLETED
        )
        _make_session(
            db_session, assessment, candidate_two, SessionStatus.IN_PROGRESS
        )

    assessment_titles = [assessment.title for assessment in assessments]

    db_session.commit()
    db_session.expunge_all()

    result, queries = _count_queries(
        db_session, lambda: get_all_assessments(db_session)
    )
    select_queries = [
        q for q in queries if q.strip().upper().startswith("SELECT")
    ]

    # 1 query for the assessment list + 1 batched selectinload query for
    # every assessment's sessions, regardless of how many assessments
    # there are. Without eager loading this would be 1 + len(assessments).
    assert len(select_queries) == 2

    by_title = {item["title"]: item for item in result}
    for title in assessment_titles:
        item = by_title[title]
        assert item["candidates"] == 2
        assert item["completed"] == 1
