from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Annotated

from app.core.security import get_current_user
from app.database.database import get_db
from app.schema.candidate_response_metrics import (
    CandidateAssessmentMetricsResponse,
    CandidateResponseMetricsResponse,
)
from app.services import metrics


router = APIRouter(tags=["metrics"])


def require_recruiter(current_user: dict) -> None:
    if current_user.get("role") != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can view candidate metrics.",
        )


@router.get("/candidate-responses/{candidate_response_id}/metrics")
def get_response_metrics(
    db: Annotated[Session, Depends(get_db)],
    candidate_response_id: int,
    current_user: Annotated[dict, Depends(get_current_user)],
) -> CandidateResponseMetricsResponse:
    require_recruiter(current_user)
    return metrics.get_metrics_for_response(db, candidate_response_id)


@router.get("/candidate-assessments/{candidate_assessment_id}/metrics")
def get_assessment_metrics(
    db: Annotated[Session, Depends(get_db)],
    candidate_assessment_id: int,
    current_user: Annotated[dict, Depends(get_current_user)],
) -> CandidateAssessmentMetricsResponse:
    require_recruiter(current_user)
    return metrics.get_metrics_for_assessment(db, candidate_assessment_id)
