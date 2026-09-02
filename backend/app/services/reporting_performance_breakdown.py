from typing import Literal

from sqlalchemy import case, func
from sqlalchemy.orm import Session

from app.models.adversarial_question import AdversarialQuestion
from app.models.assessment_question import AssessmentQuestion
from app.models.candidate_response import CandidateResponse, CorrectnessStatus
from app.models.question_bank import QuestionBank
from app.models.question_category import QuestionCategory
from app.schema.dashboard import (
    BreakdownSlice,
    PerformanceBreakdownResponse,
)


def get_performance_breakdown(
    db: Session,
    by: Literal["category", "difficulty"],
) -> PerformanceBreakdownResponse:
    success_expr = case(
        (CandidateResponse.is_correct == CorrectnessStatus.CORRECT, 1),
        else_=0,
    )

    if by == "category":
        label_expr = func.coalesce(
            QuestionCategory.category_name,
            "Uncategorised",
        )
    else:
        label_expr = func.coalesce(
            QuestionBank.difficulty,
            "Unknown",
        )

    rows = (
        db.query(
            label_expr.label("label"),
            func.count(CandidateResponse.response_id).label("attempt_count"),
            func.avg(success_expr).label("avg_success_rate"),
        )
        .join(
            AssessmentQuestion,
            AssessmentQuestion.assessment_q_id
            == CandidateResponse.assessment_question_id,
        )
        .join(
            AdversarialQuestion,
            AdversarialQuestion.adv_question_id
            == AssessmentQuestion.adv_question_id,
        )
        .join(
            QuestionBank,
            QuestionBank.question_bank_id
            == AdversarialQuestion.source_question_id,
        )
        .outerjoin(
            QuestionCategory,
            QuestionCategory.category_id == QuestionBank.category_id,
        )
        .group_by(label_expr)
        .order_by(label_expr)
        .all()
    )

    slices = [
        BreakdownSlice(
            label=row.label,
            avg_success_rate=round(float(row.avg_success_rate or 0.0), 4),
            attempt_count=int(row.attempt_count or 0),
        )
        for row in rows
    ]

    return PerformanceBreakdownResponse(by=by, slices=slices)
