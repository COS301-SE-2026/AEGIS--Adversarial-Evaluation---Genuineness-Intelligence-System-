from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Annotated
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


@router.get("/summary")
def get_dashboard_summary(
    recruiter_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> DashboardSummaryResponse:
    return dashboard.get_dashboard_summary(db, recruiter_id)


@router.get("/score-distribution")
def get_score_distribution(
    recruiter_id: int,
    db: Annotated[Session, Depends(get_db)],
) -> DashboardGraphResponse:
    return dashboard.get_graph_values(db, recruiter_id)


@router.get("/assessments")
def get_assessments_summary(
    recruiter_id: int,
    db: Annotated[Session, Depends(get_db)],
    page: int = 1,
    page_size: int = 8,
) -> DashboardTableResponse:
    return dashboard.get_assessment_summary(recruiter_id, db, page, page_size)


@router.get("/assessments/{assessment_id}")
def get_assessment_detail_cards(
    assessment_id: int,
    db: Annotated[Session, Depends(get_db)]
) -> AssessmentDetailCardResponse:
    return dashboard.get_assessment_detail_cards(assessment_id, db)


@router.get("/assessments/{assessment_id}/candidates")
def get_assessment_detail_table(
    assessment_id: int,
    db: Annotated[Session, Depends(get_db)],
    status: str | None = None,
    search: str | None = None,
    page: int = 1,
    page_size: int = 8,
) -> AssessmentDetailTableResponse:
    return dashboard.get_assessment_detail_table_info(
        db,
        assessment_id,
        status,
        search,
        page,
        page_size
    )
