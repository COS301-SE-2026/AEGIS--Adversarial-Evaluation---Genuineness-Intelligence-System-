from typing import Optional

from sqlalchemy.orm import Session

from app.models.candidate_assessment import CandidateAssessment, SessionStatus
from app.models.candidate_response import CandidateResponse
from app.models.candidate_response_metrics import CandidateResponseMetrics

# Minimum number of other completed sessions before cohort timing
MIN_COHORT_CANDIDATES = 3


def count_other_completed_sessions(
    db: Session,
    assessment_id: int,
    candidate_assessment_id: int,
) -> int:
    """Count completed sessions for ``assessment_id`` excluding this one."""
    return (
        db.query(CandidateAssessment)
        .filter(
            CandidateAssessment.assessment_id == assessment_id,
            CandidateAssessment.candidate_assess_id != candidate_assessment_id,
            CandidateAssessment.status == SessionStatus.COMPLETED,
        )
        .count()
    )


def cohort_average_active_time_ms(
    db: Session,
    assessment_question_id: int,
    exclude_candidate_assessment_id: int,
) -> Optional[float]:
    """Average active time (ms) other completed candidates spent on a question.

    Returns ``None`` when no other completed candidate has a recorded active
    time for the question.
    """
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

    active_times = [
        m.active_time_ms for m in cohort_metrics
        if m.active_time_ms is not None
    ]

    if not active_times:
        return None

    return sum(active_times) / len(active_times)
