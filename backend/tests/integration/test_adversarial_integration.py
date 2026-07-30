import pytest
from sqlalchemy.exc import IntegrityError

from app.models import (
    AdversarialQuestion,
    AdversarialStrategy,
    Assessment,
    AssessmentQuestion,
    QuestionBank,
    QuestionCategory,
    QuestionType,
    Role,
    User,
)
from app.services.adversarial_service import (
    get_all_adversarial_questions,
    get_all_draft_adversarial_questions,
    save_adversarial_question,
)

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


def _make_question_bank(db, category, title):
    question = QuestionBank(
        title=title,
        content="What is 2 + 2?",
        type=QuestionType.MULTIPLE_CHOICE,
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


def _make_adversarial_question(db, source_question, strategy, status):
    adv_question = AdversarialQuestion(
        source_question_id=source_question.question_bank_id,
        content="Weaponised content",
        strategy_id=strategy.strategy_id,
        validation_status=status,
    )
    db.add(adv_question)
    db.flush()
    return adv_question


def test_delete_blocked_when_referenced_by_assessment_question(db_session):
    role = _make_role(db_session, "RECRUITER")
    user = _make_user(db_session, role, "recruiter-fk-guard@example.com")
    category = _make_category(db_session, "FK Guard Category")
    source_question = _make_question_bank(
        db_session, category, "FK guard source question"
    )
    strategy = _make_strategy(db_session, "FK Guard Strategy")

    referenced_question = _make_adversarial_question(
        db_session, source_question, strategy, "validated"
    )
    assessment = Assessment(
        title="FK guard assessment",
        duration_mins=30,
        creator_id=user.user_id,
    )
    db_session.add(assessment)
    db_session.flush()

    assessment_question = AssessmentQuestion(
        assessments_id=assessment.assessment_id,
        adv_question_id=referenced_question.adv_question_id,
    )
    db_session.add(assessment_question)
    db_session.commit()
    referenced_id = referenced_question.adv_question_id

    db_session.delete(referenced_question)
    with pytest.raises(IntegrityError):
        db_session.commit()
    db_session.rollback()

    still_present = (
        db_session.query(AdversarialQuestion)
        .filter(AdversarialQuestion.adv_question_id == referenced_id)
        .first()
    )
    assert still_present is not None

    unreferenced_question = _make_adversarial_question(
        db_session, source_question, strategy, "draft"
    )
    db_session.commit()
    unreferenced_id = unreferenced_question.adv_question_id

    db_session.delete(unreferenced_question)
    db_session.commit()

    deleted_check = (
        db_session.query(AdversarialQuestion)
        .filter(AdversarialQuestion.adv_question_id == unreferenced_id)
        .first()
    )
    assert deleted_check is None


def test_validated_and_draft_filters_return_correct_real_rows(db_session):
    category = _make_category(db_session, "Filter Test Category")
    source_question = _make_question_bank(
        db_session, category, "Filter test source question"
    )
    strategy = _make_strategy(db_session, "Filter Test Strategy")

    draft_one = _make_adversarial_question(
        db_session, source_question, strategy, "draft"
    )
    draft_two = _make_adversarial_question(
        db_session, source_question, strategy, "draft"
    )
    validated_one = _make_adversarial_question(
        db_session, source_question, strategy, "validated"
    )
    validated_two = _make_adversarial_question(
        db_session, source_question, strategy, "validated"
    )
    db_session.commit()

    draft_ids = {draft_one.adv_question_id, draft_two.adv_question_id}
    validated_ids = {
        validated_one.adv_question_id, validated_two.adv_question_id
    }

    validated_results = get_all_adversarial_questions(db_session)
    draft_results = get_all_draft_adversarial_questions(db_session)

    assert {q.adv_question_id for q in validated_results} == validated_ids
    assert all(
        q.validation_status == "validated" for q in validated_results
    )

    assert {q.adv_question_id for q in draft_results} == draft_ids
    assert all(q.validation_status == "draft" for q in draft_results)


def test_save_adversarial_question_persists_across_fresh_query(db_session):
    category = _make_category(db_session, "Transition Test Category")
    source_question = _make_question_bank(
        db_session, category, "Transition test source question"
    )
    strategy = _make_strategy(db_session, "Transition Test Strategy")
    draft_question = _make_adversarial_question(
        db_session, source_question, strategy, "draft"
    )
    db_session.commit()
    draft_id = draft_question.adv_question_id

    result = save_adversarial_question(db_session, draft_id)
    assert result.validation_status == "validated"

    db_session.expunge_all()
    refetched = (
        db_session.query(AdversarialQuestion)
        .filter(AdversarialQuestion.adv_question_id == draft_id)
        .one()
    )
    assert refetched is not draft_question
    assert refetched.validation_status == "validated"
