import pytest
from sqlalchemy.exc import IntegrityError

from app.models import (
    AdversarialQuestion,
    AdversarialStrategy,
    Assessment,
    AssessmentQuestion,
    CandidateAssessment,
    CandidateResponse,
    CandidateResponseMetrics,
    QuestionBank,
    QuestionCategory,
    QuestionType,
    Role,
    SessionStatus,
    User,
)

pytestmark = pytest.mark.integration


def _make_role(db, name):
    role = Role(role_name=name)
    db.add(role)
    db.flush()
    return role


def _make_user(db, role, email):
    user = User(
        email=email, full_name="Metrics Test User",
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


def _make_question_bank(db, category, title):
    question = QuestionBank(
        title=title,
        content="What is 2 + 2?",
        type=QuestionType.FILL_IN_THE_BLANK,
        maximum_score=1.0,
        category_id=category.category_id,
    )
    db.add(question)
    db.flush()
    return question


def _make_strategy(db, name):
    strategy = AdversarialStrategy(strategy_name=name)
    db.add(strategy)
    db.flush()
    return strategy


def _make_adversarial_question(db, source_question, strategy):
    adv_question = AdversarialQuestion(
        source_question_id=source_question.question_bank_id,
        content="Weaponised content",
        strategy_id=strategy.strategy_id,
    )
    db.add(adv_question)
    db.flush()
    return adv_question


def _make_assessment(db, creator):
    assessment = Assessment(
        title="Metrics test assessment",
        duration_mins=30,
        creator_id=creator.user_id,
    )
    db.add(assessment)
    db.flush()
    return assessment


def _make_assessment_question(db, assessment, adv_question):
    assessment_question = AssessmentQuestion(
        assessments_id=assessment.assessment_id,
        adv_question_id=adv_question.adv_question_id,
    )
    db.add(assessment_question)
    db.flush()
    return assessment_question


def _make_candidate_assessment(db, candidate, assessment):
    candidate_assessment = CandidateAssessment(
        status=SessionStatus.IN_PROGRESS,
        access_token=f"token-{candidate.user_id}-{assessment.assessment_id}",
        candidate_id=candidate.user_id,
        assessment_id=assessment.assessment_id,
    )
    db.add(candidate_assessment)
    db.flush()
    return candidate_assessment


def _make_candidate_response(db, candidate_assessment, assessment_question):
    response = CandidateResponse(
        candidate_assessment_id=candidate_assessment.candidate_assess_id,
        assessment_question_id=assessment_question.assessment_q_id,
        candidate_answer="my answer",
    )
    db.add(response)
    db.flush()
    return response


def _build_response_fixtures(db):
    role = _make_role(db, "CANDIDATE")
    candidate = _make_user(db, role, "candidate-metrics@example.com")
    creator = _make_user(db, role, "creator-metrics@example.com")
    category = _make_category(db, "Metrics Test Category")
    source_question = _make_question_bank(
        db, category, "Metrics source question"
    )
    strategy = _make_strategy(db, "Metrics Test Strategy")
    adv_question = _make_adversarial_question(db, source_question, strategy)
    assessment = _make_assessment(db, creator)
    assessment_question = _make_assessment_question(
        db, assessment, adv_question
    )
    candidate_assessment = _make_candidate_assessment(
        db, candidate, assessment
    )
    response = _make_candidate_response(
        db, candidate_assessment, assessment_question
    )
    return candidate_assessment, response


def test_metrics_row_round_trips_with_defaults(db_session):
    candidate_assessment, response = _build_response_fixtures(db_session)

    metrics = CandidateResponseMetrics(
        candidate_response_id=response.response_id,
        candidate_assessment_id=candidate_assessment.candidate_assess_id,
    )
    db_session.add(metrics)
    db_session.commit()

    fetched = (
        db_session.query(CandidateResponseMetrics)
        .filter_by(candidate_response_id=response.response_id)
        .one()
    )
    assert fetched.candidate_assessment_id == (
        candidate_assessment.candidate_assess_id
    )
    assert fetched.active_time_ms == 0
    assert fetched.unique_keys_count == 0
    assert fetched.chars_alnum == 0
    assert fetched.chars_special == 0
    assert fetched.backspace_count == 0
    assert fetched.copy_event_count == 0
    assert fetched.copy_char_count == 0
    assert fetched.paste_event_count == 0
    assert fetched.paste_char_count == 0
    assert fetched.focus_loss_count == 0
    assert fetched.focus_loss_time_ms == 0
    assert fetched.created_at is not None
    assert fetched.updated_at is not None


def test_metrics_row_stores_provided_values(db_session):
    candidate_assessment, response = _build_response_fixtures(db_session)

    metrics = CandidateResponseMetrics(
        candidate_response_id=response.response_id,
        candidate_assessment_id=candidate_assessment.candidate_assess_id,
        active_time_ms=12000,
        unique_keys_count=42,
        chars_alnum=100,
        chars_special=10,
        backspace_count=5,
        copy_event_count=1,
        copy_char_count=18,
        paste_event_count=2,
        paste_char_count=30,
        focus_loss_count=3,
        focus_loss_time_ms=4500,
    )
    db_session.add(metrics)
    db_session.commit()

    fetched = (
        db_session.query(CandidateResponseMetrics)
        .filter_by(candidate_response_id=response.response_id)
        .one()
    )
    assert fetched.active_time_ms == 12000
    assert fetched.unique_keys_count == 42
    assert fetched.paste_char_count == 30
    assert fetched.copy_char_count == 18
    assert fetched.focus_loss_time_ms == 4500


def test_metrics_row_rejects_duplicate_response_id(db_session):
    candidate_assessment, response = _build_response_fixtures(db_session)

    db_session.add(CandidateResponseMetrics(
        candidate_response_id=response.response_id,
        candidate_assessment_id=candidate_assessment.candidate_assess_id,
    ))
    db_session.commit()

    db_session.add(CandidateResponseMetrics(
        candidate_response_id=response.response_id,
        candidate_assessment_id=candidate_assessment.candidate_assess_id,
    ))
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()


def test_metrics_row_rejects_unknown_response_id(db_session):
    candidate_assessment, response = _build_response_fixtures(db_session)

    metrics = CandidateResponseMetrics(
        candidate_response_id=response.response_id + 999999,
        candidate_assessment_id=candidate_assessment.candidate_assess_id,
    )
    db_session.add(metrics)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()
