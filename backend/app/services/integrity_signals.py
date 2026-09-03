from sqlalchemy.orm import Session

from app.models.candidate_response_metrics import CandidateResponseMetrics
from app.schema.dashboard import IntegritySummaryResponse


def get_integrity_summary(db: Session) -> IntegritySummaryResponse:
    rows = db.query(CandidateResponseMetrics).all()

    if not rows:
        return IntegritySummaryResponse(
            pct_responses_elevated_paste_reliance=0.0,
            pct_assessments_with_elevated_review=0.0,
            avg_focus_loss_count=0.0,
            total_responses_analyzed=0,
        )

    total_responses = len(rows)
    focus_loss_total = 0
    paste_heavy_responses = 0
    flagged_assessments = set()
    seen_assessments = set()

    for row in rows:
        candidate_assessment_id = int(row.candidate_assessment_id)
        seen_assessments.add(candidate_assessment_id)
        focus_loss_total += int(row.focus_loss_count or 0)

        total_chars = (
            int(row.chars_alnum or 0)
            + int(row.paste_char_count or 0)
        )
        if total_chars > 0:
            paste_ratio = int(row.paste_char_count or 0) / total_chars
            if paste_ratio > 0.4:
                paste_heavy_responses += 1
                flagged_assessments.add(candidate_assessment_id)

        if (
            int(row.focus_loss_count or 0) >= 3
            or int(row.focus_loss_time_ms or 0) > 60000
        ):
            flagged_assessments.add(candidate_assessment_id)

    return IntegritySummaryResponse(
        pct_responses_elevated_paste_reliance=round(
            paste_heavy_responses / total_responses, 4
        ) if total_responses else 0.0,
        pct_assessments_with_elevated_review=round(
            len(flagged_assessments) / len(seen_assessments), 4
        ) if seen_assessments else 0.0,
        avg_focus_loss_count=round(
            focus_loss_total / total_responses, 4
        ) if total_responses else 0.0,
        total_responses_analyzed=total_responses,
    )
