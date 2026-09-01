from typing import Optional
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.candidate_assessment import CandidateAssessment, SessionStatus
from app.models.candidate_response import CandidateResponse
from app.models.candidate_response_metrics import CandidateResponseMetrics
from app.models.assessment_question import AssessmentQuestion
from app.models.adversarial_question import AdversarialQuestion
from app.schema.reporting_timeline import (
    BehavioralSummaryResponse,
    MetricsTimelineResponse,
    QuestionTimelineSegment,
    TimelineEvent,
)

TYPING_BURST_MULTIPLIER = 2
MIN_COHORT_CANDIDATES = 3


def _get_candidate_assessment_or_404(
    db: Session,
    candidate_assessment_id: int,
) -> CandidateAssessment:
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
            detail="Candidate assessment not found",
        )

    return session


def get_behavioral_summary(
    db: Session,
    candidate_assessment_id: int,
) -> BehavioralSummaryResponse:
    session = _get_candidate_assessment_or_404(db, candidate_assessment_id)

    return BehavioralSummaryResponse(
        summary=session.behavioral_summary,
        generated_at=None,
    )


def _chars_per_second(
    chars_alnum: int,
    chars_special: int,
    active_time_ms: int,
) -> Optional[float]:
    if active_time_ms <= 0:
        return None
    return (chars_alnum + chars_special) / (active_time_ms / 1000)


def _cohort_average_chars_per_second(
    db: Session,
    assessment_question_id: int,
    exclude_candidate_assessment_id: int,
) -> Optional[float]:
    cohort_metrics = (
        db.query(CandidateResponseMetrics)
        .join(
            CandidateResponse,
            CandidateResponse.response_id
            == CandidateResponseMetrics.candidate_response_id,
        )
        .join(
            CandidateAssessment,
            CandidateAssessment.candidate_assess_id
            == CandidateResponse.candidate_assessment_id,
        )
        .filter(
            CandidateResponse.assessment_question_id
            == assessment_question_id,
            CandidateResponse.candidate_assessment_id
            != exclude_candidate_assessment_id,
            CandidateAssessment.status == SessionStatus.COMPLETED,
        )
        .all()
    )

    rates = [
        rate for rate in (
            _chars_per_second(
                metrics.chars_alnum,
                metrics.chars_special,
                metrics.active_time_ms,
            )
            for metrics in cohort_metrics
        )
        if rate is not None
    ]

    if not rates:
        return None

    return sum(rates) / len(rates)


def _is_typing_burst(
    db: Session,
    metrics: CandidateResponseMetrics,
    assessment_question_id: int,
    candidate_assessment_id: int,
) -> bool:
    candidate_rate = _chars_per_second(
        metrics.chars_alnum, metrics.chars_special, metrics.active_time_ms,
    )
    if candidate_rate is None:
        return False

    cohort_avg = _cohort_average_chars_per_second(
        db, assessment_question_id, candidate_assessment_id,
    )
    if cohort_avg is None:
        return False

    return candidate_rate > TYPING_BURST_MULTIPLIER * cohort_avg


def _build_events(
    question_id: int,
    active_time_ms: int,
    paste_event_count: int,
    paste_char_count: int,
    focus_loss_count: int,
    is_typing_burst: bool,
) -> list[TimelineEvent]:
    events: list[TimelineEvent] = []

    if paste_event_count > 0:
        events.append(TimelineEvent(
            event_type="paste",
            start_offset_ms=0,
            duration_ms=active_time_ms,
            question_id=question_id,
            magnitude=paste_char_count,
        ))

    if focus_loss_count > 0:
        events.append(TimelineEvent(
            event_type="focus_loss",
            start_offset_ms=0,
            duration_ms=active_time_ms,
            question_id=question_id,
            magnitude=focus_loss_count,
        ))

    if is_typing_burst:
        events.append(TimelineEvent(
            event_type="typing_burst",
            start_offset_ms=0,
            duration_ms=active_time_ms,
            question_id=question_id,
            magnitude=None,
        ))

    return events


def get_metrics_timeline(
    db: Session,
    candidate_assessment_id: int,
) -> MetricsTimelineResponse:
    session = _get_candidate_assessment_or_404(db, candidate_assessment_id)

    rows = (
        db.query(
            CandidateResponse,
            AssessmentQuestion,
            AdversarialQuestion,
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
        .outerjoin(
            CandidateResponseMetrics,
            CandidateResponseMetrics.candidate_response_id
            == CandidateResponse.response_id,
        )
        .filter(
            CandidateResponse.candidate_assessment_id
            == candidate_assessment_id
        )
        .order_by(
            AssessmentQuestion.display_order,
            AssessmentQuestion.assessment_q_id,
        )
        .all()
    )

    other_completed_count = (
        db.query(CandidateAssessment)
        .filter(
            CandidateAssessment.assessment_id == session.assessment_id,
            CandidateAssessment.candidate_assess_id
            != candidate_assessment_id,
            CandidateAssessment.status == SessionStatus.COMPLETED,
        )
        .count()
    )

    enough_cohort_data = other_completed_count >= MIN_COHORT_CANDIDATES

    questions: list[QuestionTimelineSegment] = []
    total_active_time_ms = 0

    for position, (_, aq, adv, metrics) in enumerate(rows, start=1):
        active_time_ms = metrics.active_time_ms if metrics else 0
        total_active_time_ms += active_time_ms

        is_typing_burst = (
            enough_cohort_data
            and metrics is not None
            and _is_typing_burst(
                db, metrics, aq.assessment_q_id, candidate_assessment_id,
            )
        )

        question_id = adv.source_question_id

        events = _build_events(
            question_id=question_id,
            active_time_ms=active_time_ms,
            paste_event_count=(
                metrics.paste_event_count if metrics else 0
            ),
            paste_char_count=(
                metrics.paste_char_count if metrics else 0
            ),
            focus_loss_count=(
                metrics.focus_loss_count if metrics else 0
            ),
            is_typing_burst=is_typing_burst,
        )

        questions.append(QuestionTimelineSegment(
            question_id=question_id,
            question_order=position,
            active_time_ms=active_time_ms,
            events=events,
        ))

    return MetricsTimelineResponse(
        total_active_time_ms=total_active_time_ms,
        questions=questions,
    )
