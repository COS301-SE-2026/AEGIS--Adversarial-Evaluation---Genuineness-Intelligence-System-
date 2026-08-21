from sqlalchemy import func, case
from fastapi import HTTPException, status
from typing import Optional
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
    AssessmentDetailCardResponse,
    AssessmentDetailTableResponse,
    FilterableTableItem,
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
            func.coalesce(
            User.full_name,
            User.email,
        ).label("candidate_name"),
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
        db.query(func.coalesce(User.full_name, User.email))
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


def _get_assessment_card_details(
        db: Session,
        assessment_id: int
) -> AssessmentDetailCardResponse:
    assessment = (
        db.query(Assessment)
        .filter(Assessment.assessment_id == assessment_id)
        .first()
    )

    if assessment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found",
        )

    _assessment_name = assessment.title

    _top_performers_assessment = (
        db.query(
            func.coalesce(
            User.full_name,
            User.email,
        ).label("candidate_name"),
            ((CandidateAssessment.candidate_score /
              CandidateAssessment.total_score) * 100).label("score_percent"),
        )
        .join(
            CandidateAssessment,
            CandidateAssessment.candidate_id == User.user_id,
        )
        .join(
            Assessment,
            CandidateAssessment.assessment_id == Assessment.assessment_id,
        )
        .filter(
            Assessment.assessment_id == assessment_id,
            CandidateAssessment.status == SessionStatus.COMPLETED,
            CandidateAssessment.total_score.isnot(None),
            CandidateAssessment.total_score > 0,
            CandidateAssessment.candidate_score.isnot(None),
        )
        .order_by(
            ((CandidateAssessment.candidate_score /
              CandidateAssessment.total_score) * 100).desc()
        )
        .limit(3)
        .all()
    )

    _top_performers_assessment = [
        TopPerformer(candidate_name=row.candidate_name,
                     score_percent=round(row.score_percent, 2))
        for row in _top_performers_assessment
    ]

    _average_score_for_assessment = (
        db.query(
            func.avg(
                (CandidateAssessment.candidate_score /
                 CandidateAssessment.total_score) * 100
            ).label("average_score_percent")
        )
        .join(
            Assessment,
            CandidateAssessment.assessment_id == Assessment.assessment_id,
        )
        .filter(
            Assessment.assessment_id == assessment_id,
            CandidateAssessment.status == SessionStatus.COMPLETED,
            CandidateAssessment.total_score.isnot(None),
            CandidateAssessment.total_score > 0,
            CandidateAssessment.candidate_score.isnot(None),
        )
        .scalar()
    )

    _average_score_for_assessment = round(
        _average_score_for_assessment,
        2) if _average_score_for_assessment else 0.0

    _average_completion_time = (
        db.query(
            func.avg(
                func.extract('epoch',
                             CandidateAssessment.end_time -
                             CandidateAssessment.start_time)
            ).label("average_completion_time")
        )
        .filter(
            CandidateAssessment.assessment_id == assessment_id,
            CandidateAssessment.status == SessionStatus.COMPLETED,
            CandidateAssessment.end_time.isnot(None),
            CandidateAssessment.start_time.isnot(None),
        )
        .scalar()
    )

    _average_completion_time = round(
        _average_completion_time,
        2) if _average_completion_time else 0.0

    _ai_usage_rate = (
        db.query(AIAnalysis)
        .join(
            CandidateResponse,
            AIAnalysis.response_id == CandidateResponse.response_id
        )
        .join(
            CandidateAssessment,
            CandidateResponse.candidate_assessment_id
            == CandidateAssessment.candidate_assess_id
        )
        .join(
            Assessment,
            CandidateAssessment.assessment_id == Assessment.assessment_id
        )
        .filter(
            Assessment.assessment_id == assessment_id,
            CandidateAssessment.status == SessionStatus.COMPLETED,
        )
        .count()
    )

    _total_sessions_for_assessment = (
        db.query(CandidateAssessment)
        .filter(
            CandidateAssessment.assessment_id == assessment_id,
            CandidateAssessment.status == SessionStatus.COMPLETED
        )
        .count()
    )

    _ai_percent = (_ai_usage_rate / _total_sessions_for_assessment
                   * 100) if _total_sessions_for_assessment else 0.0

    if _ai_percent >= 70:
        _ai_level = AIUsageLevel.HIGH
    elif _ai_percent >= 35:
        _ai_level = AIUsageLevel.MEDIUM
    else:
        _ai_level = AIUsageLevel.LOW

    _ai_usage_rate = AIUsageRate(
        level=_ai_level,
        percent=round(_ai_percent, 2)
    )

    return AssessmentDetailCardResponse(
        assessment_id=assessment_id,
        assessment_name=_assessment_name,
        top_performers=_top_performers_assessment,
        average_total_percent=_average_score_for_assessment,
        average_completion_time=_average_completion_time,
        ai_usage=_ai_usage_rate
    )


def _get_assessment_detail_table_items(
        db: Session,
        assessment_id: int,
        status: Optional[str],
        search: Optional[str],
        page: int,
        page_size: int,
) -> AssessmentDetailTableResponse:

    total_score_percent = (
        CandidateAssessment.candidate_score /
        CandidateAssessment.total_score * 100
    )

    result_status = case(
        (total_score_percent >= 50, "PASS"),
        else_="FAIL",
    ).label("status")

    ai_rating_percent = (
        func.avg(AIAnalysis.similarity_score) * 100
    ).label("ai_rating_percent")

    candidate_name = func.coalesce(
        User.full_name,
        User.email,
    ).label("candidate_name")

    query = (
        db.query(
            CandidateAssessment.candidate_assess_id,
            User.user_id.label("candidate_id"),
            candidate_name,
            total_score_percent.label("total_score_percent"),
            result_status,
            ai_rating_percent,
        )
        .join(
            User,
            CandidateAssessment.candidate_id == User.user_id,
        )
        .outerjoin(
            CandidateResponse,
            CandidateResponse.candidate_assessment_id
            == CandidateAssessment.candidate_assess_id,
        )
        .outerjoin(
            AIAnalysis,
            AIAnalysis.response_id == CandidateResponse.response_id,
        )
        .filter(
            CandidateAssessment.assessment_id == assessment_id,
            CandidateAssessment.status == SessionStatus.COMPLETED,
            CandidateAssessment.total_score.isnot(None),
            CandidateAssessment.total_score > 0,
            CandidateAssessment.candidate_score.isnot(None),
        )
    )

    if search:
        query = query.filter(
            candidate_name.ilike(f"%{search.strip()}%")
        )

    query = query.group_by(
        User.user_id,
        User.full_name,
        User.email,
        CandidateAssessment.candidate_assess_id,
        CandidateAssessment.candidate_score,
        CandidateAssessment.total_score,
    )

    if status:
        query = query.having(
            result_status == status.strip().upper()
        )

    rows = (
        query
        .order_by(candidate_name)
        .offset((page - 1) * page_size)
        .limit(page_size)
        .all()
    )

    _items = [
        FilterableTableItem(
            candidate_assess_id=row.candidate_assess_id,
            candidate_id=row.candidate_id,
            candidate_name=row.candidate_name,
            total_score_percent=round(row.total_score_percent, 2),
            status=row.status,
            ai_rating_percent=round(
                row.ai_rating_percent or 0.0,
                2,
            ),
        )
        for row in rows
    ]

    return AssessmentDetailTableResponse(
        items=_items,
        page=page,
        page_size=page_size,
    )


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


# assessment detail
def get_assessment_detail_cards(
        assessment_id: int,
        db: Session
) -> AssessmentDetailCardResponse:
    return _get_assessment_card_details(db, assessment_id)


def get_assessment_detail_table_info(
        db: Session,
        assessment_id: int,
        status: Optional[str] = None,
        search: Optional[str] = None,
        page: int = 1,
        page_size: int = 8
) -> AssessmentDetailTableResponse:
    return _get_assessment_detail_table_items(
        db=db,
        assessment_id=assessment_id,
        status=status,
        search=search,
        page=page,
        page_size=page_size
    )
