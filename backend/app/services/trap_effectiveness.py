from typing import Optional

from sqlalchemy.orm import Session

from app.models.adversarial_question import AdversarialQuestion
from app.models.adversarial_strategies import AdversarialStrategy
from app.models.assessment_question import AssessmentQuestion
from app.models.candidate_assessment import CandidateAssessment, SessionStatus
from app.models.candidate_response import CandidateResponse
from app.models.candidate_response_metrics import CandidateResponseMetrics
from app.models.question_bank import QuestionBank
from app.schema.trap_effectiveness import TrapEffectivenessItem
from app.services.cohort_metrics import (
    MIN_COHORT_CANDIDATES,
    cohort_average_active_time_ms,
    count_other_completed_sessions,
)
from app.services.review_priority import (
    QuestionInfo,
    QuestionMetrics,
    get_question_review_score,
)

ELEVATED_REVIEW_SCORE_THRESHOLD = 30

# Below this many completed attempts, a strategy's review_signal_rate is
# considered too noisy to act on. Judgment call -- flagged for review.
MIN_SUFFICIENT_DATA_ATTEMPTS = 5

NO_DATA = "NO_DATA"
INSUFFICIENT_DATA = "INSUFFICIENT_DATA"
SUFFICIENT_DATA = "SUFFICIENT_DATA"


def _deployed_strategies(db: Session) -> list[tuple[int, str]]:
    return (
        db.query(
            AdversarialStrategy.strategy_id, AdversarialStrategy.strategy_name,
        )
        .join(
            AdversarialQuestion,
            AdversarialQuestion.strategy_id
            == AdversarialStrategy.strategy_id,
        )
        .join(
            AssessmentQuestion,
            AssessmentQuestion.adv_question_id
            == AdversarialQuestion.adv_question_id,
        )
        .distinct()
        .all()
    )


def _generated_question_count(db: Session, strategy_id: int) -> int:
    return (
        db.query(AdversarialQuestion)
        .join(
            AssessmentQuestion,
            AssessmentQuestion.adv_question_id
            == AdversarialQuestion.adv_question_id,
        )
        .filter(AdversarialQuestion.strategy_id == strategy_id)
        .distinct()
        .count()
    )


def _completed_response_rows(db: Session, strategy_id: int):
    return (
        db.query(
            CandidateResponse,
            AssessmentQuestion,
            QuestionBank,
            CandidateResponseMetrics,
        )
        .join(
            AssessmentQuestion,
            CandidateResponse.assessment_question_id
            == AssessmentQuestion.assessment_q_id,
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
        .join(
            CandidateAssessment,
            CandidateResponse.candidate_assessment_id
            == CandidateAssessment.candidate_assess_id,
        )
        .outerjoin(
            CandidateResponseMetrics,
            CandidateResponseMetrics.candidate_response_id
            == CandidateResponse.response_id,
        )
        .filter(
            AdversarialQuestion.strategy_id == strategy_id,
            CandidateAssessment.status == SessionStatus.COMPLETED,
        )
        .all()
    )


def _response_review_score(
    db: Session,
    candidate_response: CandidateResponse,
    assessment_question: AssessmentQuestion,
    question_bank: QuestionBank,
    metrics: Optional[CandidateResponseMetrics],
) -> float:
    other_completed_count = count_other_completed_sessions(
        db,
        assessment_question.assessments_id,
        candidate_response.candidate_assessment_id,
    )
    cohort_avg_active_time_ms = (
        cohort_average_active_time_ms(
            db,
            assessment_question.assessment_q_id,
            candidate_response.candidate_assessment_id,
        )
        if other_completed_count >= MIN_COHORT_CANDIDATES
        else None
    )

    question_info = QuestionInfo(order=1, type=question_bank.type)
    question_metrics = QuestionMetrics(
        active_time_ms=metrics.active_time_ms if metrics else 0,
        focus_loss_time_ms=metrics.focus_loss_time_ms if metrics else 0,
        paste_char_count=metrics.paste_char_count if metrics else 0,
        chars_alnum=metrics.chars_alnum if metrics else 0,
        chars_special=metrics.chars_special if metrics else 0,
        copy_char_count=metrics.copy_char_count if metrics else 0,
        copy_event_count=metrics.copy_event_count if metrics else 0,
    )

    score, _ = get_question_review_score(
        question_info, question_metrics, cohort_avg_active_time_ms,
    )
    return score


def _evidence_status(completed_attempt_count: int) -> str:
    if completed_attempt_count == 0:
        return NO_DATA
    if completed_attempt_count < MIN_SUFFICIENT_DATA_ATTEMPTS:
        return INSUFFICIENT_DATA
    return SUFFICIENT_DATA


def _build_trap_effectiveness_item(
    db: Session, strategy_id: int, strategy_name: str,
) -> TrapEffectivenessItem:
    rows = _completed_response_rows(db, strategy_id)
    completed_attempt_count = len(rows)

    elevated_review_count = sum(
        1
        for candidate_response, aq, question_bank, metrics in rows
        if _response_review_score(
            db, candidate_response, aq, question_bank, metrics,
        ) > ELEVATED_REVIEW_SCORE_THRESHOLD
    )

    review_signal_rate = (
        (elevated_review_count / completed_attempt_count) * 100
        if completed_attempt_count > 0
        else None
    )

    return TrapEffectivenessItem(
        trap_id=strategy_id,
        trap_name=strategy_name,
        generated_question_count=_generated_question_count(db, strategy_id),
        completed_attempt_count=completed_attempt_count,
        elevated_review_count=elevated_review_count,
        review_signal_rate=review_signal_rate,
        evidence_status=_evidence_status(completed_attempt_count),
    )


def get_trap_effectiveness(db: Session) -> list[TrapEffectivenessItem]:
    return [
        _build_trap_effectiveness_item(db, strategy_id, strategy_name)
        for strategy_id, strategy_name in _deployed_strategies(db)
    ]
