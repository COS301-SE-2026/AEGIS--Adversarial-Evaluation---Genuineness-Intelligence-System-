from typing import Dict, List

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models.candidate_assessment import CandidateAssessment, SessionStatus
from app.models.candidate_response_metrics import CandidateResponseMetrics
from app.schema.metrics_radar import MetricsRadarResponse, RadarAxis


MIN_COHORT_SIZE = 3


def _sum_metrics_for_candidate_assessment(
    db: Session,
    candidate_assessment_id: int,
) -> Dict[str, int]:
    row = (
        db.query(
            func.coalesce(func.sum(
                CandidateResponseMetrics.paste_char_count), 0)
            .label("paste_char_count"),
            func.coalesce(func.sum(
                CandidateResponseMetrics.backspace_count), 0)
            .label("backspace_count"),
            func.coalesce(func.sum(
                CandidateResponseMetrics.chars_alnum), 0)
            .label("chars_alnum"),
            func.coalesce(func.sum(
                CandidateResponseMetrics.chars_special), 0)
            .label("chars_special"),
            func.coalesce(func.sum(
                CandidateResponseMetrics.active_time_ms), 0)
            .label("active_time_ms"),
            func.coalesce(func.sum(
                CandidateResponseMetrics.focus_loss_time_ms), 0)
            .label("focus_loss_time_ms"),
        )
        .filter(CandidateResponseMetrics.candidate_assessment_id
                == candidate_assessment_id)
        .one()
    )

    return {
        "paste_char_count": int(row.paste_char_count or 0),
        "backspace_count": int(row.backspace_count or 0),
        "chars_alnum": int(row.chars_alnum or 0),
        "chars_special": int(row.chars_special or 0),
        "active_time_ms": int(row.active_time_ms or 0),
        "focus_loss_time_ms": int(row.focus_loss_time_ms or 0),
    }


def _compute_behavioral_ratios(metrics: Dict[str, int]) -> Dict[str, float]:
    total_chars = max(metrics["chars_alnum"] + metrics["chars_special"], 1)
    active_time_s = max(metrics["active_time_ms"] / 1000.0, 1.0)

    return {
        "paste_ratio": min(metrics["paste_char_count"] / total_chars, 1.0),
        "backspace_rate": min(metrics["backspace_count"] / total_chars, 1.0),
        "typing_speed": total_chars / active_time_s,
        "focus_loss_rate": min(
            metrics["focus_loss_time_ms"] / max(metrics["active_time_ms"], 1),
            1.0,
        ),
    }


def _min_max_normalize(value: float, cohort_values: List[float]) -> float:
    if not cohort_values:
        return 0.0

    low = min(cohort_values)
    high = max(cohort_values)

    if high == low:
        return 0.0

    return (value - low) / (high - low)


def get_candidate_summed_metrics(
    db: Session,
    candidate_assessment_id: int,
) -> dict:
    return _sum_metrics_for_candidate_assessment(db, candidate_assessment_id)


def get_cohort_summed_metrics(
    db: Session,
    candidate_assessment_id: int,
) -> list[dict]:
    target = (
        db.query(CandidateAssessment)
        .filter(
            CandidateAssessment.candidate_assess_id
            == candidate_assessment_id)
        .one()
    )

    cohort_ids = (
        db.query(CandidateAssessment.candidate_assess_id)
        .filter(
            CandidateAssessment.assessment_id == target.assessment_id,
            CandidateAssessment.status == SessionStatus.COMPLETED,
            CandidateAssessment.candidate_assess_id != candidate_assessment_id,
        )
        .all()
    )

    return [
        _sum_metrics_for_candidate_assessment(db, row.candidate_assess_id)
        for row in cohort_ids
    ]


def get_metrics_radar(
    db: Session,
    candidate_assessment_id: int,
) -> MetricsRadarResponse:
    candidate_raw = get_candidate_summed_metrics(db, candidate_assessment_id)
    candidate = _compute_behavioral_ratios(candidate_raw)

    cohort_raw = get_cohort_summed_metrics(db, candidate_assessment_id)

    if len(cohort_raw) < MIN_COHORT_SIZE:
        axes = [
            RadarAxis(
                axis="paste_ratio",
                candidate_value=candidate["paste_ratio"],
                cohort_avg_value=0.0,
            ),
            RadarAxis(
                axis="backspace_rate",
                candidate_value=candidate["backspace_rate"],
                cohort_avg_value=0.0,
            ),
            RadarAxis(
                axis="typing_speed",
                candidate_value=candidate["typing_speed"],
                cohort_avg_value=0.0,
            ),
            RadarAxis(
                axis="focus_loss_rate",
                candidate_value=candidate["focus_loss_rate"],
                cohort_avg_value=0.0,
            ),
        ]
        return MetricsRadarResponse(
            axes=axes,
            cohort_sample_size=len(cohort_raw),
            insufficient_cohort_data=True,
        )

    cohort = [_compute_behavioral_ratios(row) for row in cohort_raw]

    backspace_values = [item["backspace_rate"] for item in cohort]
    speed_values = [item["typing_speed"] for item in cohort]

    candidate_backspace_norm = _min_max_normalize(
        candidate["backspace_rate"],
        backspace_values + [candidate["backspace_rate"]],
    )
    candidate_speed_norm = _min_max_normalize(
        candidate["typing_speed"],
        speed_values + [candidate["typing_speed"]],
    )

    cohort_backspace_norms = [
        _min_max_normalize(v, backspace_values + [candidate["backspace_rate"]])
        for v in backspace_values
    ]
    cohort_speed_norms = [
        _min_max_normalize(v, speed_values + [candidate["typing_speed"]])
        for v in speed_values
    ]

    cohort_avg_paste = sum(
        item["paste_ratio"] for item in cohort) / len(cohort)
    cohort_avg_backspace_norm = sum(
        cohort_backspace_norms) / len(cohort_backspace_norms)
    cohort_avg_speed_norm = sum(
        cohort_speed_norms) / len(cohort_speed_norms)
    cohort_avg_focus = sum(
        item["focus_loss_rate"] for item in cohort) / len(cohort)

    axes = [
        RadarAxis(
            axis="paste_ratio",
            candidate_value=candidate["paste_ratio"],
            cohort_avg_value=cohort_avg_paste,
        ),
        RadarAxis(
            axis="backspace_rate",
            candidate_value=candidate_backspace_norm,
            cohort_avg_value=cohort_avg_backspace_norm,
        ),
        RadarAxis(
            axis="typing_speed",
            candidate_value=candidate_speed_norm,
            cohort_avg_value=cohort_avg_speed_norm,
        ),
        RadarAxis(
            axis="focus_loss_rate",
            candidate_value=candidate["focus_loss_rate"],
            cohort_avg_value=cohort_avg_focus,
        ),
    ]

    return MetricsRadarResponse(
        axes=axes,
        cohort_sample_size=len(cohort_raw),
        insufficient_cohort_data=False,
    )
