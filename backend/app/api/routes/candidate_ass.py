from fastapi import APIRouter, Depends
from typing import Annotated
from sqlalchemy.orm import Session
from app.core.security import get_current_user
from app.database.database import get_db
from app.schema.candidate_assessment import CandidateAssessmentResponse
from app.schema.candidate_response import (
    CandidateResponseResponse,
    ResponseUpdate
)
from app.schema.candidate_response_metrics import (
    MetricsFlushRequest,
    MetricsFlushResponse,
)
from app.services.candidate import (
    flush_response_metrics,
    get_candidate_assessment_session,
    update_response
)

router = APIRouter(prefix="/candidate", tags=["candidate"])
metrics_router = APIRouter(
    prefix="/candidate-responses", tags=["candidate-response-metrics"]
)


@router.get(
    "/assessments/{candidate_assessment_id}",
    response_model=CandidateAssessmentResponse
)
async def get_candidate_assessment(
    candidate_assessment_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[dict, Depends(get_current_user)]
):
    candidate_id = int(current_user["user_id"])
    session = get_candidate_assessment_session(
        db,
        candidate_assessment_id,
        candidate_id
    )

    return CandidateAssessmentResponse(
        candidate_assess_id=session.candidate_assess_id,
        status=session.status.value,
        access_token=session.access_token,
        total_score=session.total_score,
        start_time=session.start_time,
        end_time=session.end_time
    )


@router.put(
    "/responses/{response_id}",
    response_model=CandidateResponseResponse
)
async def update_cand_response(
    response_id: int,
    payload: ResponseUpdate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[dict, Depends(get_current_user)]
):
    candidate_id = int(current_user["user_id"])
    response = update_response(
        db,
        response_id,
        candidate_id,
        payload.candidate_answer
    )

    return CandidateResponseResponse(
        response_id=response.response_id,
        candidate_assessment_id=response.candidate_assessment_id,
        assessment_question_id=response.assessment_question_id,
        candidate_answer=response.candidate_answer,
        score=response.score,
        is_correct=response.is_correct.value if response.is_correct else None
    )


@metrics_router.post(
    "/{candidate_response_id}/metrics/flush",
    response_model=MetricsFlushResponse
)
async def flush_metrics(
    candidate_response_id: int,
    payload: MetricsFlushRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[dict, Depends(get_current_user)]
):
    candidate_id = int(current_user["user_id"])
    metrics = flush_response_metrics(
        db,
        candidate_response_id,
        candidate_id,
        payload
    )

    return MetricsFlushResponse(
        candidate_response_id=metrics.candidate_response_id,
        updated_at=metrics.updated_at,
    )
