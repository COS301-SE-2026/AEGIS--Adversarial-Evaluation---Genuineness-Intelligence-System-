from fastapi import HTTPException, status
from sqlalchemy import and_
from sqlalchemy.orm import Session

from app.models.adversarial_question import AdversarialQuestion
from app.models.assessment_question import AssessmentQuestion
from app.models.candidate_assessment import CandidateAssessment
from app.models.candidate_response import CandidateResponse
from app.models.candidate_response_metrics import CandidateResponseMetrics
from app.models.question_bank import QuestionBank
from app.schema.question_analytics import (
    QuestionAnalyticsAnswer,
    QuestionAnalyticsItem,
    QuestionAnalyticsMetrics,
    QuestionAnalyticsResponse,
)
from app.services.cohort_metrics import (
    MIN_COHORT_CANDIDATES,
    cohort_average_active_time_ms,
    count_other_completed_sessions,
)
from app.services.review_priority import (
    QuestionInfo,
    QuestionMetrics,
    band_for_score,
    get_question_review_score,
)


def _zero_question_metrics() -> QuestionMetrics:
    return QuestionMetrics(
        active_time_ms=0,
        focus_loss_time_ms=0,
        paste_char_count=0,
        chars_alnum=0,
        chars_special=0,
        copy_char_count=0,
        copy_event_count=0,
    )


def _build_question_metrics(
    metrics: CandidateResponseMetrics,
) -> QuestionMetrics:
    return QuestionMetrics(
        active_time_ms=metrics.active_time_ms,
        focus_loss_time_ms=metrics.focus_loss_time_ms,
        paste_char_count=metrics.paste_char_count,
        chars_alnum=metrics.chars_alnum,
        chars_special=metrics.chars_special,
        copy_char_count=metrics.copy_char_count,
        copy_event_count=metrics.copy_event_count,
    )


def _build_analytics_metrics(
    metrics: CandidateResponseMetrics,
) -> QuestionAnalyticsMetrics:
    return QuestionAnalyticsMetrics(
        active_time_ms=metrics.active_time_ms,
        backspace_count=metrics.backspace_count,
        copy_event_count=metrics.copy_event_count,
        copy_char_count=metrics.copy_char_count,
        paste_event_count=metrics.paste_event_count,
        paste_char_count=metrics.paste_char_count,
        focus_loss_count=metrics.focus_loss_count,
        focus_loss_time_ms=metrics.focus_loss_time_ms,
    )


def _build_question_analytics_items(
    db: Session,
    candidate_assessment_id: int,
    session: CandidateAssessment,
) -> list[QuestionAnalyticsItem]:
    rows = (
        db.query(
            AssessmentQuestion,
            AdversarialQuestion,
            QuestionBank,
            CandidateResponse,
            CandidateResponseMetrics,
        )
        .join(
            AdversarialQuestion,
            AssessmentQuestion.adv_question_id
            == AdversarialQuestion.adv_question_id,
        )
        .join(
            QuestionBank,
            AdversarialQuestion.source_question_id
            == QuestionBank.question_bank_id,
        )
        .outerjoin(
            CandidateResponse,
            and_(
                CandidateResponse.assessment_question_id
                == AssessmentQuestion.assessment_q_id,
                CandidateResponse.candidate_assessment_id
                == candidate_assessment_id,
            ),
        )
        .outerjoin(
            CandidateResponseMetrics,
            CandidateResponseMetrics.candidate_response_id
            == CandidateResponse.response_id,
        )
        .filter(
            AssessmentQuestion.assessments_id == session.assessment_id,
        )
        .order_by(
            AssessmentQuestion.display_order,
            AssessmentQuestion.assessment_q_id,
        )
        .all()
    )

    other_completed_count = count_other_completed_sessions(
        db,
        session.assessment_id,
        candidate_assessment_id,
    )
    enough_cohort_data = (
        other_completed_count >= MIN_COHORT_CANDIDATES
    )

    questions = []

    for question_order, (
        assessment_question,
        adversarial_question,
        question_bank,
        response,
        metrics,
    ) in enumerate(rows, start=1):
        content = (
            adversarial_question.content
            if adversarial_question.content
            and adversarial_question.content.strip()
            else question_bank.content
        )

        if response is None:
            questions.append(
                QuestionAnalyticsItem(
                    question_order=question_order,
                    assessment_q_id=assessment_question.assessment_q_id,
                    question_bank_id=question_bank.question_bank_id,
                    title=question_bank.title,
                    content=content,
                    type=question_bank.type.value,
                    maximum_score=question_bank.maximum_score,
                    answered=False,
                    answer=None,
                    metrics=None,
                    review_score=None,
                    review_band=None,
                    contributing_factors=[],
                )
            )
            continue

        question_metrics = (
            _build_question_metrics(metrics)
            if metrics is not None
            else _zero_question_metrics()
        )

        cohort_average = (
            cohort_average_active_time_ms(
                db,
                assessment_question.assessment_q_id,
                candidate_assessment_id,
            )
            if enough_cohort_data
            else None
        )

        review_score, contributing_factors = get_question_review_score(
            QuestionInfo(
                order=question_order,
                type=question_bank.type,
            ),
            question_metrics,
            cohort_average,
        )

        questions.append(
            QuestionAnalyticsItem(
                question_order=question_order,
                assessment_q_id=assessment_question.assessment_q_id,
                question_bank_id=question_bank.question_bank_id,
                title=question_bank.title,
                content=content,
                type=question_bank.type.value,
                maximum_score=question_bank.maximum_score,
                answered=True,
                answer=_build_answer(response),
                metrics=(
                    _build_analytics_metrics(metrics)
                    if metrics is not None
                    else None
                ),
                review_score=review_score,
                review_band=band_for_score(round(review_score)),
                contributing_factors=contributing_factors,
            )
        )

    return questions


def _build_answer(
    response: CandidateResponse,
) -> QuestionAnalyticsAnswer:
    return QuestionAnalyticsAnswer(
        candidate_answer=response.candidate_answer,
        score=response.score,
        is_correct=(
            response.is_correct.value
            if response.is_correct is not None
            else None
        ),
    )


def get_question_analytics(
    db: Session,
    candidate_assessment_id: int,
) -> QuestionAnalyticsResponse:
    session = (
        db.query(CandidateAssessment)
        .filter(
            CandidateAssessment.candidate_assess_id
            == candidate_assessment_id
        )
        .first()
    )

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment session not found",
        )

    return QuestionAnalyticsResponse(
        candidate_assessment_id=candidate_assessment_id,
        questions=_build_question_analytics_items(
            db,
            candidate_assessment_id,
            session,
        ),
    )
