from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import Annotated
from app.core.security import get_current_user
from app.database.database import get_db
from app.schema.dashboard import (
    DashboardSummaryResponse,
    DashboardGraphResponse,
    DashboardTableResponse,
    AssessmentDetailCardResponse,
    AssessmentDetailTableResponse,
)
from app.services import dashboard

router = APIRouter(prefix="/admin/dashboard", tags=["dashboard"])


def require_recruiter(current_user: dict) -> None:
    if current_user.get("role") != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can view dashboard data.",
        )


@router.get("/summary")
def get_dashboard_summary(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
) -> DashboardSummaryResponse:
    require_recruiter(current_user)
    recruiter_id = int(current_user["user_id"])
    return dashboard.get_dashboard_summary(db, recruiter_id)


@router.get("/score-distribution")
def get_score_distribution(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
) -> DashboardGraphResponse:
    require_recruiter(current_user)
    recruiter_id = int(current_user["user_id"])
    return dashboard.get_graph_values(db, recruiter_id)


@router.get("/assessments")
def get_assessments_summary(
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
    page: int = 1,
    page_size: int = 8,
) -> DashboardTableResponse:
    require_recruiter(current_user)
    recruiter_id = int(current_user["user_id"])
    return dashboard.get_assessment_summary(recruiter_id, db, page, page_size)


@router.get("/assessments/{assessment_id}")
def get_assessment_detail_cards(
    assessment_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
) -> AssessmentDetailCardResponse:
    require_recruiter(current_user)
    return dashboard.get_assessment_detail_cards(assessment_id, db)


@router.get("/assessments/{assessment_id}/candidates")
def get_assessment_detail_table(
    assessment_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[dict, Depends(get_current_user)],
    status: str | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 8,
) -> AssessmentDetailTableResponse:
    require_recruiter(current_user)
    return dashboard.get_assessment_detail_table_info(
        db,
        assessment_id,
        status,
        search,
        page,
        page_size
    )
