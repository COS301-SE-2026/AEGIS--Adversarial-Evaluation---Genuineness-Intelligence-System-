from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.security import get_current_user
from app.database.database import get_db
from app.schema.candidate_assessment import CandidateAssessmentResponse
from app.schema.candidate_response import (
    CandidateResponseResponse,
    ResponseUpdate
)
from app.services.candidate import (
    get_candidate_assessment_session,
    update_response
)

router = APIRouter(prefix="/candidate", tags=["candidate"])


@router.get(
    "/assessments/{candidate_assessment_id}",
    response_model=CandidateAssessmentResponse
)
async def get_candidate_assessment(
    candidate_assessment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
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
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
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
