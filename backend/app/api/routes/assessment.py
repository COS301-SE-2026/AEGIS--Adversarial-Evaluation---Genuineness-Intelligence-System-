from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schema.candidate_assessment import InviteCreate
from app.services.assessment import (
    get_all_assessments,
    get_candidate_responses,
    get_assessment_by_id,
    save_candidate_response,
    submit_candidate_assessment,
    create_candidate_assessment,
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
    # Join-table fields
    assessment_q_id: int
    display_order: Optional[int] = None
    marks: Optional[float] = None
    # Flattened question_bank fields  (Optional because questions_id)
    # FK is nullable ,a row can exist without a linked question.
    question_bank_id: Optional[int] = None
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
    # Returns all assessments. Returns an empty list if none exist.
    return get_all_assessments(db)


@router.get(
    "/{assessment_id}",
    response_model=AssessmentDetailResponse,
)
async def get_assessment(
    assessment_id: int,
    db: Session = Depends(get_db),
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
                "question_bank_id": (
                    aq.question_bank.question_bank_id
                    if aq.question_bank else None
                ),
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
