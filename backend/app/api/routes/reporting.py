from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Annotated
from app.core.security import get_current_user
from app.database.database import get_db
from app.schema.dashboard import QuestionQualityResponse, ThroughputResponse
from app.services.assessment_report import get_question_quality
from app.services.assess_throughput import get_throughput


router = APIRouter(prefix="/reporting", tags=["reporting"])


def require_recruiter(current_user: dict) -> None:
    if current_user.get("role") != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can view reporting data.",
        )


@router.get("/question-quality")
def get_question_quality_report(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
) -> QuestionQualityResponse:
    require_recruiter(current_user)
    return get_question_quality(db)


@router.get("/throughput")
def get_throughput_report(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
) -> ThroughputResponse:
    require_recruiter(current_user)
    return get_throughput(db)
