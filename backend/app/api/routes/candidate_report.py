from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Annotated

from app.core.security import get_current_user
from app.database.database import get_db
from app.schema.reporting_timeline import (
    BehavioralSummaryResponse,
    MetricsTimelineResponse,
)
from app.services import reporting_timeline

router = APIRouter(tags=["candidate-report"])


def require_recruiter(current_user: dict) -> None:
    if current_user.get("role") != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can view candidate report data.",
        )


@router.get(
    "/candidate-assessments/{candidate_assessment_id}/behavioral-summary"
)
def get_behavioral_summary(
    db: Annotated[Session, Depends(get_db)],
    candidate_assessment_id: int,
    current_user: Annotated[dict, Depends(get_current_user)],
) -> BehavioralSummaryResponse:
    require_recruiter(current_user)
    return reporting_timeline.get_behavioral_summary(
        db, candidate_assessment_id,
    )


@router.get(
    "/candidate-assessments/{candidate_assessment_id}/metrics-timeline"
)
def get_metrics_timeline(
    db: Annotated[Session, Depends(get_db)],
    candidate_assessment_id: int,
    current_user: Annotated[dict, Depends(get_current_user)],
) -> MetricsTimelineResponse:
    require_recruiter(current_user)
    return reporting_timeline.get_metrics_timeline(
        db, candidate_assessment_id,
    )
