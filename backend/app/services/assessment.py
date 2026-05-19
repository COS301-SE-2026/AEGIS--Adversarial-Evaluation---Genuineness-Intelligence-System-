from sqlalchemy.orm import Session, selectinload

from app.models.assessment import Assessment
from app.models.assessment_question import AssessmentQuestion


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
