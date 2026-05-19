import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.models.assessment import Assessment
from app.models.assessment_question import AssessmentQuestion
from app.models.candidate_assessment import CandidateAssessment, SessionStatus
from app.models.user import User


def get_all_assessments(db: Session) -> list[Assessment]:
    # Returns every assessment row without loading question details.
    return db.query(Assessment).all()


def get_assessment_by_id(
    db: Session, assessment_id: int
) -> Assessment | None:
    assessment = (
        db.query(Assessment)
        .options(
            selectinload(Assessment.assessment_questions)
            .selectinload(AssessmentQuestion.question_bank)
        )
        .filter(Assessment.assessment_id == assessment_id)
        .first()
    )
    if assessment is not None:
        assessment.assessment_questions.sort(
            key=lambda aq: (
                aq.display_order is None,
                aq.display_order or 0,
            )
        )
    return assessment


def create_candidate_assessment(
    db: Session,
    assessment_id: int,
    candidate_id: int,
) -> CandidateAssessment:
    assessment = (
        db.query(Assessment)
        .filter(Assessment.assessment_id == assessment_id)
        .first()
    )
    if assessment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found",
        )

    candidate = (
        db.query(User)
        .filter(User.user_id == candidate_id)
        .first()
    )
    if candidate is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found",
        )

    existing = (
        db.query(CandidateAssessment)
        .filter(
            CandidateAssessment.candidate_id == candidate_id,
            CandidateAssessment.assessment_id == assessment_id,
        )
        .first()
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Candidate has already been invited to this assessment",
        )

    access_token = str(uuid.uuid4())
    new_session = CandidateAssessment(
        assessment_id=assessment_id,
        candidate_id=candidate_id,
        access_token=access_token,
        status=SessionStatus.STARTED,
        candidate_score=None,
        total_score=None,
        start_time=None,
        end_time=None,
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session
