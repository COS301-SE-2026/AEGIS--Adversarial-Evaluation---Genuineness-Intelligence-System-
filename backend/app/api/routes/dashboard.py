from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Annotated
from app.database.database import get_db
from app.schema.dashboard import (
    DashboardSummaryResponse,
    DashboardGraphResponse
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
