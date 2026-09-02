from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.assessment import Assessment
from app.models.candidate_assessment import CandidateAssessment, SessionStatus
from app.schema.dashboard import ThroughputResponse


def get_throughput(db: Session) -> ThroughputResponse:
    total_assessments = (
        db.query(func.count(Assessment.assessment_id)).scalar() or 0
    )

    active_count = (
        db.query(func.count(CandidateAssessment.candidate_assess_id))
        .filter(
            CandidateAssessment.status.in_(
                [SessionStatus.STARTED, SessionStatus.IN_PROGRESS]
            )
        )
        .scalar()
        or 0
    )

    completed_count = (
        db.query(func.count(CandidateAssessment.candidate_assess_id))
        .filter(CandidateAssessment.status == SessionStatus.COMPLETED)
        .scalar()
        or 0
    )

    expired_count = (
        db.query(func.count(CandidateAssessment.candidate_assess_id))
        .filter(CandidateAssessment.status == SessionStatus.EXPIRED)
        .scalar()
        or 0
    )

    avg_time_to_completion_seconds = (
        db.query(
            func.avg(
                func.extract(
                    "epoch",
                    CandidateAssessment.end_time
                    - CandidateAssessment.start_time,
                )
            )
        )
        .filter(
            CandidateAssessment.status == SessionStatus.COMPLETED,
            CandidateAssessment.end_time.isnot(None),
            CandidateAssessment.start_time.isnot(None),
        )
        .scalar()
    )

    avg_score = (
        db.query(
            func.avg(
                (
                    CandidateAssessment.candidate_score
                    / CandidateAssessment.total_score
                )
                * 100
            )
        )
        .filter(
            CandidateAssessment.status == SessionStatus.COMPLETED,
            CandidateAssessment.candidate_score.isnot(None),
            CandidateAssessment.total_score.isnot(None),
            CandidateAssessment.total_score > 0,
        )
        .scalar()
    )

    completion_rate = (
        completed_count / (completed_count + expired_count)
        if (completed_count + expired_count) > 0
        else 0.0
    )

    return ThroughputResponse(
        total_assessments=total_assessments,
        active_count=active_count,
        completed_count=completed_count,
        expired_count=expired_count,
        avg_time_to_completion_seconds=(
            round(avg_time_to_completion_seconds, 2)
            if avg_time_to_completion_seconds is not None
            else None
        ),
        avg_score=round(avg_score, 2) if avg_score is not None else None,
        completion_rate=round(completion_rate, 4),
    )
