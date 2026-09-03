from datetime import datetime
from typing import Annotated, List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.core.piston import PistonClient
from app.database.database import get_db
from app.schema.candidate_assessment import InviteCreate
from app.schema.assessment import (
    AssessmentCreate,
    AssessmentCreatedResponse,
    AssessmentQuestionCreate,
    AssessmentQuestionCreatedResponse,
    AssessmentUpdate,
    ExecuteRequest
)
from app.services.assessment import (
    get_all_assessments,
    get_candidate_responses,
    get_assessment_by_id,
    get_candidate_assessments,
    get_questions_for_candidate_assessment,
    save_candidate_response,
    execute_candidate_code,
    submit_candidate_assessment,
    create_candidate_assessment,
    start_candidate_assessment,
    create_assessment,
    update_assessment,
    activate_assessment,
    add_question_to_assessment,
    remove_question_from_assessment,
)
from app.schema.candidate_response import (
    CandidateResponseResponse,
    ResponseCreate,
)
from app.schema.candidate_assessment import CandidateAssessmentResponse
from app.schema.review_priority import ReviewPriorityResponse
from app.services.review_priority import get_review_priority
from app.schema.metrics_radar import MetricsRadarResponse
from app.services.reporting_candidate_metrics import get_metrics_radar
from app.services.candidate import get_candidate_assessment_session


router = APIRouter(prefix="/assessments", tags=["assessments"])
candidate_response_router = APIRouter(
    prefix="/candidate-assessments",
    tags=["candidate-assessments"],
)


class AssessmentListItem(BaseModel):
    assessment_id: int
    title: str
    description: Optional[str] = None
    duration_mins: int
    status: Optional[str] = None
    created_at: datetime

    class Config:
        orm_mode = True


class AssessmentQuestionItem(BaseModel):
    assessment_q_id: int
    display_order: Optional[int] = None
    marks: Optional[float] = None
    adv_question_id: Optional[int] = None
    title: Optional[str] = None
    content: Optional[str] = None
    type: Optional[str] = None
    maximum_score: Optional[float] = None
    tags: Optional[List[str]] = None


class AssessmentDetailResponse(BaseModel):
    assessment_id: int
    title: str
    description: Optional[str] = None
    duration_mins: int
    created_at: datetime
    questions: List[AssessmentQuestionItem]


@router.get("/", response_model=List[AssessmentListItem])
async def list_assessments(
    search: Optional[str] = None,
    status: Optional[str] = None,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
    db: Session = Depends(get_db),
):
    return get_all_assessments(db, search, status, limit, offset)


@router.post(
    "/",
    response_model=AssessmentCreatedResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_new_assessment(
    payload: AssessmentCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can create assessments.",
        )
    creator_id = int(current_user["user_id"])
    return create_assessment(
        db,
        payload.title,
        payload.description,
        payload.duration_mins,
        creator_id,
    )


@router.get(
    "/my-assessments",
    status_code=status.HTTP_200_OK,
)
async def list_my_assessments(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    candidate_id = int(current_user["user_id"])
    sessions = get_candidate_assessments(db, candidate_id)
    return [
        {
            "candidate_assess_id": s.candidate_assess_id,
            "status": s.status.value,
            "access_token": s.access_token,
            "start_time": s.start_time,
            "end_time": s.end_time,
            "assessment": (
                {
                    "assessment_id": s.assessment.assessment_id,
                    "title": s.assessment.title,
                    "description": s.assessment.description,
                    "duration_mins": s.assessment.duration_mins,
                }
                if s.assessment is not None
                else None
            ),
        }
        for s in sessions
    ]


@router.get(
    "/{assessment_id}",
    response_model=AssessmentDetailResponse,
)
async def get_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    assessment = get_assessment_by_id(db, assessment_id)
    if assessment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found",
        )
    return {
        "assessment_id": assessment.assessment_id,
        "title": assessment.title,
        "description": assessment.description,
        "duration_mins": assessment.duration_mins,
        "created_at": assessment.created_at,
        "questions": [
            {
                "assessment_q_id": aq.assessment_q_id,
                "display_order": aq.display_order,
                "marks": aq.marks,
                "adv_question_id": aq.adv_question_id,
                "title": (
                    aq.question_bank.title
                    if aq.question_bank else None
                ),
                "content": (
                    aq.question_bank.content
                    if aq.question_bank else None
                ),
                "type": (
                    aq.question_bank.type.value
                    if aq.question_bank else None
                ),
                "maximum_score": (
                    aq.question_bank.maximum_score
                    if aq.question_bank else None
                ),
                "tags": (
                    aq.question_bank.tags
                    if aq.question_bank else None
                ),
            }
            for aq in assessment.assessment_questions
        ],
    }


@router.patch(
    "/{assessment_id}",
    response_model=AssessmentCreatedResponse,
)
async def update_assessment_route(
    assessment_id: int,
    payload: AssessmentUpdate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can update assessments.",
        )
    return update_assessment(
        db,
        assessment_id,
        payload.title,
        payload.description,
        payload.duration_mins,
    )


@router.post(
    "/{assessment_id}/activate",
    response_model=AssessmentCreatedResponse,
)
async def activate_assessment_route(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can activate assessments.",
        )
    return activate_assessment(db, assessment_id)


@router.post(
    "/{assessment_id}/questions",
    response_model=AssessmentQuestionCreatedResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_question_to_assessment_route(
    assessment_id: int,
    payload: AssessmentQuestionCreate,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
):
    if current_user.get("role") != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can modify assessment questions.",
        )
    return add_question_to_assessment(
        db,
        assessment_id,
        payload.adv_question_id,
        payload.display_order,
        payload.marks,
    )


@router.delete(
    "/{assessment_id}/questions/{adv_question_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
async def remove_question_from_assessment_route(
    assessment_id: int,
    adv_question_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
):
    if current_user.get("role") != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can modify assessment questions.",
        )
    remove_question_from_assessment(db, assessment_id, adv_question_id)


@candidate_response_router.post(
    "/{candidate_assessment_id}/responses",
    response_model=CandidateResponseResponse,
)
async def save_response(
    candidate_assessment_id: int,
    response_in: ResponseCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    get_candidate_assessment_session(
        db, candidate_assessment_id, int(current_user["user_id"]),
    )
    return save_candidate_response(
        db,
        candidate_assessment_id,
        response_in,
    )


@candidate_response_router.get(
    "/{candidate_assessment_id}/responses",
    response_model=List[CandidateResponseResponse],
)
async def list_responses(
    candidate_assessment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    get_candidate_assessment_session(
        db, candidate_assessment_id, int(current_user["user_id"]),
    )
    return get_candidate_responses(
        db,
        candidate_assessment_id,
    )


@candidate_response_router.post(
    "/{candidate_assessment_id}/submit",
    response_model=CandidateAssessmentResponse,
)
async def submit_assessment(
    candidate_assessment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    get_candidate_assessment_session(
        db, candidate_assessment_id, int(current_user["user_id"]),
    )
    return submit_candidate_assessment(
        db,
        candidate_assessment_id,
    )


@router.post(
    "/take/{access_token}/start",
    status_code=status.HTTP_200_OK,
)
async def start_assessment(
    access_token: str,
    db: Session = Depends(get_db),
):
    session = start_candidate_assessment(db, access_token)
    return {
        "candidate_assess_id": session.candidate_assess_id,
        "status": session.status.value,
        "assessment_id": session.assessment_id,
        "candidate_id": session.candidate_id,
        "start_time": session.start_time,
        "end_time": session.end_time,
        "access_token": session.access_token,
    }


@router.post(
    "/{assessment_id}/invite",
    status_code=status.HTTP_201_CREATED,
)
async def invite_candidate(
    assessment_id: int,
    body: InviteCreate,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can invite candidates.",
        )
    assessment = get_assessment_by_id(db, assessment_id)
    if assessment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found",
        )
    if assessment.creator_id != int(current_user["user_id"]):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "You can only invite candidates to assessments you created."
            ),
        )
    session = create_candidate_assessment(db, assessment_id, body.candidate_id)
    return {
        "candidate_assess_id": session.candidate_assess_id,
        "access_token": session.access_token,
        "status": session.status.value,
        "assessment_id": session.assessment_id,
        "candidate_id": session.candidate_id,
        "access_link": (
         f"http://localhost:3000/assessment/take?token={session.access_token}"
        ),
    }


@router.get(
    "/candidate/{candidate_assess_id}/questions",
    status_code=status.HTTP_200_OK,
)
async def get_candidate_assessment_questions(
    candidate_assess_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    user_id = int(current_user["user_id"])
    questions = get_questions_for_candidate_assessment(
        db, candidate_assess_id, user_id
    )
    return [
        {
            "assessment_q_id": aq.assessment_q_id,
            "display_order": aq.display_order,
            "marks": aq.marks,
            "question": (
                {
                    "question_bank_id": aq.question_bank.question_bank_id,
                    "title": aq.question_bank.title,
                    "content": (
                        aq.adversarial_question.content
                        if aq.adversarial_question is not None
                        and aq.adversarial_question.content
                        and aq.adversarial_question.content.strip()
                        else aq.question_bank.content
                    ),
                    "type": aq.question_bank.type.value,
                    "maximum_score": aq.question_bank.maximum_score,
                    "tags": aq.question_bank.tags,
                    "question_metadata": aq.question_bank.question_metadata,
                }
                if aq.question_bank is not None
                else None
            ),
        }
        for aq in questions
    ]


@router.post(
    "/execute"
)
def execute_code(
    payload: ExecuteRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    get_candidate_assessment_session(
        db, payload.candidate_assessment_id, int(current_user["user_id"]),
    )
    piston_client = PistonClient()
    return execute_candidate_code(
        db=db,
        candidate_assessment_id=payload.candidate_assessment_id,
        assessment_question_id=payload.assessment_question_id,
        code=payload.code,
        piston_client=piston_client,
    )


@candidate_response_router.get(
    "/{candidate_assessment_id}/review-priority",
    response_model=ReviewPriorityResponse,
)
def read_review_priority(
    candidate_assessment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can access review priority.",
        )
    return get_review_priority(db, candidate_assessment_id)


@candidate_response_router.get(
    "/{candidate_assessment_id}/metrics-radar",
    response_model=MetricsRadarResponse,
)
def read_metrics_radar(
    candidate_assessment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can access candidate metrics radar.",
        )
    return get_metrics_radar(db, candidate_assessment_id)
