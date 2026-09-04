from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.assessment import Assessment
from app.models.candidate_assessment import CandidateAssessment
from app.schema.dashboard import IntegrityScoreAverageResponse


def get_integrity_score_average(
    db: Session, recruiter_id: int
) -> IntegrityScoreAverageResponse:
    scored_candidate_count = (
        db.query(func.count(CandidateAssessment.candidate_assess_id))
        .join(
            Assessment,
            Assessment.assessment_id == CandidateAssessment.assessment_id,
        )
        .filter(
            Assessment.creator_id == recruiter_id,
            CandidateAssessment.integrity_score.isnot(None),
        )
        .scalar()
        or 0
    )

    average = (
        db.query(func.avg(CandidateAssessment.integrity_score))
        .join(
            Assessment,
            Assessment.assessment_id == CandidateAssessment.assessment_id,
        )
        .filter(
            Assessment.creator_id == recruiter_id,
            CandidateAssessment.integrity_score.isnot(None),
        )
        .scalar()
    )

    return IntegrityScoreAverageResponse(
        average_integrity_score=(
            int(float(average) + 0.5) if average is not None else None
        ),
        scored_candidate_count=scored_candidate_count,
    )
