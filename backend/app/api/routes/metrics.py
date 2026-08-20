from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Annotated
from app.database.database import get_db
from app.schema.metrics import CandidateMetricsResponse
from app.services import metrics


router = APIRouter(tags=["metrics"])


@router.get("/candidate-responses/{candidate_response_id}/metrics")
def get_response_metrics(
    db: Annotated[Session, Depends(get_db)],
    candidate_response_id: int,
) -> CandidateMetricsResponse:
    return metrics.get_metrics_for_response(db, candidate_response_id)


@router.get("/candidate-assessments/{candidate_assessment_id}/metrics")
def get_assessment_metrics(
    db: Annotated[Session, Depends(get_db)],
    candidate_assessment_id: int,
) -> list[CandidateMetricsResponse]:
    return metrics.get_metrics_for_assessment(db, candidate_assessment_id)
