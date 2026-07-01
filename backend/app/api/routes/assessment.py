from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import get_current_user
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schema.candidate_assessment import InviteCreate
from app.schema.assessment import (
    AssessmentCreate,
    AssessmentCreatedResponse,
)
from app.services.assessment import (
    get_all_assessments,
    get_candidate_responses,
    get_assessment_by_id,
    get_candidate_assessments,
    get_questions_for_candidate_assessment,
    save_candidate_response,
    submit_candidate_assessment,
    create_candidate_assessment,
    start_candidate_assessment,
    create_assessment,
)
from app.schema.candidate_response import (
    CandidateResponseResponse,
    ResponseCreate,
)
from app.schema.candidate_assessment import CandidateAssessmentResponse

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
async def list_assessments(db: Session = Depends(get_db)):
    return get_all_assessments(db)


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


@candidate_response_router.post(
    "/{candidate_assessment_id}/responses",
    response_model=CandidateResponseResponse,
)
async def save_response(
    candidate_assessment_id: int,
    response_in: ResponseCreate,
    db: Session = Depends(get_db),
):
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
):
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
):
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
):
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
                    "content": aq.question_bank.content,
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
