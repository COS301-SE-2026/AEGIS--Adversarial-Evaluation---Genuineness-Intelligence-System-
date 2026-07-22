from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database.database import get_db
from app.schema.adversarial import (
    AdversarialQuestionResponse,
    GenerateAdversarialRequest,
    StrategyResponse,
)
from app.services.adversarial_service import (
    generate_adversarial_question,
    get_adversarial_questions_for_assessment,
    get_all_adversarial_questions,
    get_all_strategies,
    regenerate_adversarial_question,
)

router = APIRouter(
    prefix="/adversarial-strategies", tags=["adversarial"]
)
assessment_adversarial_router = APIRouter(
    prefix="/assessments", tags=["adversarial"]
)
question_adversarial_router = APIRouter(
    prefix="/questions", tags=["adversarial"]
)
adversarial_questions_router = APIRouter(tags=["adversarial"])


@router.get(
    "/",
    response_model=List[StrategyResponse],
    status_code=status.HTTP_200_OK,
    summary="Get all adversarial strategies",
)
async def list_strategies(db: Session = Depends(get_db)):
    return get_all_strategies(db)


@question_adversarial_router.post(
    "/{source_question_id}/generate-adversarial",
    response_model=AdversarialQuestionResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Generate an adversarial question preview",
)
async def generate_adversarial_question_route(
    source_question_id: int,
    payload: GenerateAdversarialRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can generate adversarial questions.",
        )
    return generate_adversarial_question(
        db,
        source_question_id,
        payload.strategy_id,
    )


@assessment_adversarial_router.get(
    "/{assessment_id}/adversarial-questions",
    response_model=List[AdversarialQuestionResponse],
    status_code=status.HTTP_200_OK,
    summary="Get adversarial questions for an assessment",
)
async def get_adversarial_questions_route(
    assessment_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return get_adversarial_questions_for_assessment(
        db, assessment_id
    )


@adversarial_questions_router.get(
    "/adversarial-questions",
    response_model=List[AdversarialQuestionResponse],
    status_code=status.HTTP_200_OK,
    summary="Get all adversarial questions",
)
async def get_all_adversarial_questions_route(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    return get_all_adversarial_questions(db)


@adversarial_questions_router.patch(
    "/adversarial-questions/{adv_question_id}/regenerate",
    response_model=AdversarialQuestionResponse,
    status_code=status.HTTP_200_OK,
    summary="Regenerate a draft adversarial question",
)
async def regenerate_adversarial_question_route(
    adv_question_id: int,
    payload: GenerateAdversarialRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can regenerate adversarial questions.",
        )
    return regenerate_adversarial_question(
        db,
        adv_question_id,
        payload.strategy_id,
    )
