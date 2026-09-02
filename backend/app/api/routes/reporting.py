from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database.database import get_db
from app.schema.dashboard import QuestionQualityResponse, ThroughputResponse
from app.services.assessment_report import get_question_quality
from app.services.assess_throughput import get_throughput

from app.schema.dashboard import (
    PerformanceBreakdownResponse,
    QuestionQualityResponse,
)
from app.services.assessment_report import get_question_quality
from app.services.reporting_performance_breakdown import (
    get_performance_breakdown
)

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

@router.get("/performance-breakdown")
def get_performance_breakdown_report(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
    by: Literal["category", "difficulty"] = Query(...),
) -> PerformanceBreakdownResponse:
    require_recruiter(current_user)
    return get_performance_breakdown(db, by=by)
