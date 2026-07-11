from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.candidate_assessment import CandidateAssessment


def get_candidate_assessment_session(
    db: Session,
    candidate_assessment_id: int,
    candidate_id: int
) -> CandidateAssessment:
    session = (
        db.query(CandidateAssessment)
        .filter(CandidateAssessment.candidate_assess_id ==
                candidate_assessment_id)
        .first()
    )

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment session not found"
        )

    if session.candidate_id != candidate_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid token"
        )

    return session
