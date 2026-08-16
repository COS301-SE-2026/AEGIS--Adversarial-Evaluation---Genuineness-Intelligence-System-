from sqlalchemy import func
from sqlalchemy.orm import Session
from app.schema.dashboard import (
    DashboardSummaryResponse,
    TopPerformer,
    AIUsageRate,
    AIUsageLevel,
    DashboardGraphResponse,
    AverageScore,
    DashboardTableResponse,
    TableItem,
)
from app.models.user import User
from app.models.assessment import Assessment
from app.models.candidate_assessment import CandidateAssessment, SessionStatus
from app.models.candidate_response import CandidateResponse
from app.models.ai_analysis import AIAnalysis


def _get_top_performers(
        db: Session,
        recruiter_id: int
) -> list[TopPerformer]:
    percent_expr = (
        (CandidateAssessment.candidate_score /
         CandidateAssessment.total_score) * 100
    )

    rows = (
        db.query(
            User.full_name.label("candidate_name"),
            percent_expr.label("score_percent"),
        )
        .join(
            Assessment,
            CandidateAssessment.assessment_id == Assessment.assessment_id,
        )
        .join(
            User,
            CandidateAssessment.candidate_id == User.user_id,
        )
        .filter(
            Assessment.creator_id == recruiter_id,
            CandidateAssessment.status == SessionStatus.COMPLETED,
            CandidateAssessment.total_score.isnot(None),
            CandidateAssessment.total_score > 0,
            CandidateAssessment.candidate_score.isnot(None),
        )
        .order_by(percent_expr.desc())
        .limit(3)
        .all()
    )

    return [
        TopPerformer(candidate_name=row.candidate_name,
                     score_percent=round(row.score_percent, 2))
        for row in rows
    ]


def _get_total_assessments(
        db: Session,
        recruiter_id: int
) -> int:
    return (
        db.query(Assessment)
        .filter(Assessment.creator_id == recruiter_id)
        .count()
    )


def _get_ai_usage_rate(
        db: Session,
        recruiter_id: int
) -> AIUsageRate:
    total_sessions = (
        db.query(CandidateAssessment)
        .join(Assessment, CandidateAssessment.assessment_id
              == Assessment.assessment_id)
        .filter(
            Assessment.creator_id == recruiter_id,
            CandidateAssessment.status == SessionStatus.COMPLETED
        ).count()
    )

    ai_sessions = (
        db.query(func.count(
            func.distinct(CandidateResponse.candidate_assessment_id)
            ))
        .join(
            CandidateAssessment,
            CandidateResponse.candidate_assessment_id
            == CandidateAssessment.candidate_assess_id
        )
        .join(
            Assessment,
            CandidateAssessment.assessment_id == Assessment.assessment_id
        )
        .join(
            AIAnalysis,
            AIAnalysis.response_id == CandidateResponse.response_id
        )
        .filter(
            Assessment.creator_id == recruiter_id,
            CandidateAssessment.status == SessionStatus.COMPLETED,
        )
        .scalar()
    ) or 0

    percent = (ai_sessions / total_sessions * 100) if total_sessions else 0.0
    if percent >= 70:
        level = AIUsageLevel.HIGH
    elif percent >= 35:
        level = AIUsageLevel.MEDIUM
    else:
        level = AIUsageLevel.LOW

    return AIUsageRate(
        level=level,
        percent=round(percent, 2)
    )


def _get_average_score_per_assessment(
        db: Session,
        recruiter_id: int
) -> list[AverageScore]:
    percent_expr = (
        (CandidateAssessment.candidate_score /
         CandidateAssessment.total_score) * 100
    )

    rows = (
        db.query(
            Assessment.title.label("assessment_name"),
            func.avg(percent_expr).label("average_score_percent"),
        )
        .join(
            CandidateAssessment,
            CandidateAssessment.assessment_id == Assessment.assessment_id,
        )
        .filter(
            Assessment.creator_id == recruiter_id,
            CandidateAssessment.status == SessionStatus.COMPLETED,
            CandidateAssessment.total_score.isnot(None),
            CandidateAssessment.total_score > 0,
            CandidateAssessment.candidate_score.isnot(None),
        )
        .group_by(Assessment.assessment_id, Assessment.title)
        .order_by(Assessment.title)
        .all()
    )

    return [
        AverageScore(assessment_name=row.assessment_name,
                     average_score=round(row.average_score_percent, 2))
        for row in rows
    ]


def _get_table_items(
        db: Session,
        recruiter_id: int,
        page: int,
        page_size: int,
) -> list[TableItem]:
    percentage_expr = (
        (CandidateAssessment.candidate_score /
         CandidateAssessment.total_score) * 100
    )

    top_candidate_name = (
        db.query(User.full_name)
        .join(
            CandidateAssessment,
            CandidateAssessment.candidate_id == User.user_id
        )
        .filter(
            CandidateAssessment.assessment_id == Assessment.assessment_id,
            CandidateAssessment.status == SessionStatus.COMPLETED,
            CandidateAssessment.total_score.isnot(None),
            CandidateAssessment.total_score > 0,
            CandidateAssessment.candidate_score.isnot(None),
        )
        .order_by(percentage_expr.desc())
        .limit(1)
        .correlate(Assessment)
        .scalar_subquery()
    )

    rows = (
        db.query(
            Assessment.assessment_id,
            Assessment.title.label("name"),
            func.avg(percentage_expr).label("average_score_percent"),
            top_candidate_name.label("top_candidate_name"),
        )
        .join(
            CandidateAssessment,
            CandidateAssessment.assessment_id == Assessment.assessment_id,
        )
        .filter(
            Assessment.creator_id == recruiter_id,
            CandidateAssessment.status == SessionStatus.COMPLETED,
            CandidateAssessment.total_score.isnot(None),
            CandidateAssessment.total_score > 0,
            CandidateAssessment.candidate_score.isnot(None),
        )
        .group_by(Assessment.assessment_id, Assessment.title)
        .order_by(Assessment.title)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    return [
        TableItem(assessment_id=row.assessment_id,
                  name=row.name,
                  average_score_percent=round(row.average_score_percent, 2),
                  top_candidate_name=row.top_candidate_name)
        for row in rows
    ]


def get_dashboard_summary(
        db: Session,
        recruiter_id: int
) -> DashboardSummaryResponse:
    return DashboardSummaryResponse(
        top_performers=_get_top_performers(db, recruiter_id),
        total_assessments=_get_total_assessments(db, recruiter_id),
        ai_usage_rate=_get_ai_usage_rate(db, recruiter_id)
    )


def get_graph_values(
        db: Session,
        recruiter_id: int
) -> DashboardGraphResponse:
    return DashboardGraphResponse(
        bars=_get_average_score_per_assessment(db, recruiter_id)
    )


def get_assessment_summary(
        recruiter_id: int,
        db: Session,
        page: int,
        page_size: int,
) -> DashboardTableResponse:
    return DashboardTableResponse(
        items=_get_table_items(db, recruiter_id, page, page_size),
        page=page,
        page_size=page_size,
    )
