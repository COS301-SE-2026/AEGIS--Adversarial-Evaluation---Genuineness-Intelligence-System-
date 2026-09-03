from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.models.candidate_assessment import CandidateAssessment
from app.models.candidate_response_metrics import CandidateResponseMetrics
from app.schema.candidate_response_metrics import (
    CandidateAssessmentMetricsResponse,
    CandidateResponseMetricsResponse,
)


def get_metrics_for_response(
    db: Session,
    candidate_response_id: int,
) -> CandidateResponseMetricsResponse:
    metrics = (
        db.query(CandidateResponseMetrics)
        .filter(
            CandidateResponseMetrics.candidate_response_id
            == candidate_response_id
        )
        .first()
    )

    if metrics is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Metrics not found",
        )

    return CandidateResponseMetricsResponse.model_validate(
        metrics,
        from_attributes=True,
    )


def get_metrics_for_assessment(
    db: Session,
    candidate_assessment_id: int,
) -> CandidateAssessmentMetricsResponse:
    metrics_rows = (
        db.query(CandidateResponseMetrics)
        .filter(
            CandidateResponseMetrics.candidate_assessment_id
            == candidate_assessment_id
        )
        .order_by(CandidateResponseMetrics.candidate_response_id)
        .all()
    )

    session = (
        db.query(CandidateAssessment)
        .filter(
            CandidateAssessment.candidate_assess_id
            == candidate_assessment_id
        )
        .first()
    )

    return CandidateAssessmentMetricsResponse(
        behavioral_summary=session.behavioral_summary if session else None,
        metrics=[
            CandidateResponseMetricsResponse.model_validate(
                metrics,
                from_attributes=True,
            )
            for metrics in metrics_rows
        ],
    )
