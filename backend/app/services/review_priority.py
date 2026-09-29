from dataclasses import dataclass
from typing import Optional

from sqlalchemy.orm import Session

from app.models.adversarial_question import AdversarialQuestion
from app.models.assessment_question import AssessmentQuestion
from app.models.candidate_assessment import CandidateAssessment
from app.models.candidate_response import CandidateResponse
from app.models.candidate_response_metrics import CandidateResponseMetrics
from app.models.question_bank import QuestionBank, QuestionType
from app.schema.review_priority import (
    NotableQuestion,
    ReviewPriorityResponse,
)
from app.services.cohort_metrics import (
    MIN_COHORT_CANDIDATES,
    cohort_average_active_time_ms,
    count_other_completed_sessions,
)

WEIGHTS: dict[QuestionType, dict[str, float]] = {
    QuestionType.MULTIPLE_CHOICE: {
        "focus": 0.35,
        "copy": 0.45,
        "speed": 0.20,
    },
    QuestionType.FILL_IN_THE_BLANK: {
        "focus": 0.20,
        "paste": 0.50,
        "copy": 0.20,
        "speed": 0.10,
    },
    QuestionType.CODING: {
        "focus": 0.15,
        "paste": 0.40,
        "copy": 0.10,
        "speed": 0.35,
    },
}

QUESTION_TYPE_LABELS: dict[QuestionType, str] = {
    QuestionType.MULTIPLE_CHOICE: "multiple-choice",
    QuestionType.FILL_IN_THE_BLANK: "fill-in-the-blank",
    QuestionType.CODING: "coding",
}


@dataclass(frozen=True)
class QuestionInfo:
    order: int
    type: QuestionType


@dataclass(frozen=True)
class QuestionMetrics:
    active_time_ms: int
    focus_loss_time_ms: int
    paste_char_count: int
    chars_alnum: int
    chars_special: int
    copy_char_count: int
    copy_event_count: int


def _clamp(value: float) -> float:
    return max(0.0, min(1.0, value))


def focus_signal(active_time_ms: int, focus_loss_time_ms: int) -> float:
    return _clamp(
        focus_loss_time_ms / max(active_time_ms * 0.5, 1)
    )


def paste_signal(
    question_type: QuestionType,
    chars_alnum: int,
    chars_special: int,
    paste_char_count: int,
) -> Optional[float]:
    if question_type == QuestionType.MULTIPLE_CHOICE:
        return None
    total_chars = chars_alnum + chars_special
    return _clamp(paste_char_count / max(total_chars * 0.5, 1))


def copy_signal(copy_char_count: int, copy_event_count: int) -> float:
    return _clamp(max(copy_char_count / 25, copy_event_count / 2))


def speed_signal(
    active_time_ms: int,
    cohort_avg_active_time_ms: Optional[float],
) -> Optional[float]:
    if cohort_avg_active_time_ms is None or cohort_avg_active_time_ms <= 0:
        return None
    ratio = active_time_ms / cohort_avg_active_time_ms
    return _clamp(1 - ratio)


def _describe_signal(
    name: str,
    order: int,
    label: str,
    value: float,
    metrics: QuestionMetrics,
) -> str:
    percent = round(value * 100)

    if name == "focus":
        return (
            f"Question {order} ({label}): the browser lost focus for "
            f"{percent}% of the time spent on this question."
        )
    if name == "paste":
        return (
            f"Question {order} ({label}): {percent}% of characters were "
            f"pasted rather than typed."
        )
    if name == "copy":
        return (
            f"Question {order} ({label}): copy activity was elevated on "
            f"this question ({metrics.copy_event_count} copy event(s), "
            f"{metrics.copy_char_count} characters copied)."
        )
    return (
        f"Question {order} ({label}): this response was completed "
        f"notably faster than other candidates' typical time on this "
        f"question."
    )


def _score_and_factor_entries(
    question: QuestionInfo,
    metrics: QuestionMetrics,
    cohort_data: Optional[float],
) -> tuple[float, list[tuple[float, str]]]:
    weights = WEIGHTS[question.type]
    label = QUESTION_TYPE_LABELS[question.type]

    candidate_signals: dict[str, Optional[float]] = {
        "focus": focus_signal(
            metrics.active_time_ms, metrics.focus_loss_time_ms,
        ),
        "paste": paste_signal(
            question.type, metrics.chars_alnum, metrics.chars_special,
            metrics.paste_char_count,
        ),
        "copy": copy_signal(
            metrics.copy_char_count, metrics.copy_event_count,
        ),
        "speed": speed_signal(metrics.active_time_ms, cohort_data),
    }

    weighted_sum = 0.0
    weight_total = 0.0
    entries: list[tuple[float, str]] = []

    for name, weight in weights.items():
        value = candidate_signals[name]
        if value is None:
            continue
        weighted_sum += weight * value
        weight_total += weight
        if value > 0.4:
            entries.append((
                value,
                _describe_signal(
                    name, question.order, label, value, metrics,
                ),
            ))

    if weight_total == 0:
        return 0.0, entries

    score = 100 * weighted_sum / weight_total
    strong_signal_count = sum(
        value is not None and value >= 0.6
        for value in candidate_signals.values()
    )
    if strong_signal_count >= 2:
        score += 15
    if strong_signal_count >= 3:
        score += 10

    return min(score, 100.0), entries


def get_question_review_score(
    question: QuestionInfo,
    metrics: QuestionMetrics,
    cohort_data: Optional[float],
) -> tuple[float, list[str]]:
    score, entries = _score_and_factor_entries(question, metrics, cohort_data)
    return score, [sentence for _, sentence in entries]


def band_for_score(score: int) -> str:
    if score < 30:
        return "low"
    if score < 60:
        return "medium"
    return "high"


def _aggregate_question_scores(
    question_scores: list[float],
    question_weights: list[Optional[float]],
) -> float:
    if not question_scores:
        return 0.0

    has_complete_approved_weights = (
        len(question_scores) == len(question_weights)
        and all(
            weight is not None and weight >= 0
            for weight in question_weights
        )
    )
    if has_complete_approved_weights:
        total_weight = sum(question_weights)
        if total_weight and total_weight > 0:
            return sum(
                score * weight
                for score, weight in zip(question_scores, question_weights)
            ) / total_weight

    return sum(question_scores) / len(question_scores)


def _fetch_question_rows(db: Session, candidate_assessment_id: int):
    return (
        db.query(
            CandidateResponse,
            AssessmentQuestion,
            QuestionBank,
            CandidateResponseMetrics,
        )
        .join(
            AssessmentQuestion,
            CandidateResponse.assessment_question_id
            == AssessmentQuestion.assessment_q_id,
        )
        .join(
            AdversarialQuestion,
            AssessmentQuestion.adv_question_id
            == AdversarialQuestion.adv_question_id,
        )
        .join(
            QuestionBank,
            AdversarialQuestion.source_question_id
            == QuestionBank.question_bank_id,
        )
        .outerjoin(
            CandidateResponseMetrics,
            CandidateResponseMetrics.candidate_response_id
            == CandidateResponse.response_id,
        )
        .filter(
            CandidateResponse.candidate_assessment_id
            == candidate_assessment_id
        )
        .order_by(
            AssessmentQuestion.display_order,
            AssessmentQuestion.assessment_q_id,
        )
        .all()
    )


def get_review_priority(
    db: Session,
    candidate_assessment_id: int,
) -> ReviewPriorityResponse:
    session = (
        db.query(CandidateAssessment)
        .filter(
            CandidateAssessment.candidate_assess_id
            == candidate_assessment_id
        )
        .first()
    )

    if session is None:
        return ReviewPriorityResponse(
            score=0, band="low", contributing_factors=[],
        )

    rows = _fetch_question_rows(db, candidate_assessment_id)

    if not rows:
        return ReviewPriorityResponse(
            score=0, band="low", contributing_factors=[],
        )

    other_completed_count = count_other_completed_sessions(
        db, session.assessment_id, candidate_assessment_id,
    )
    enough_cohort_data = other_completed_count >= MIN_COHORT_CANDIDATES

    question_scores: list[float] = []
    question_weights: list[Optional[float]] = []
    contributing_factors: list[str] = []
    per_question: list[tuple[int, float, Optional[str]]] = []

    for position, (_, aq, question_bank, metrics) in enumerate(rows, start=1):
        cohort_avg_active_time_ms = (
            cohort_average_active_time_ms(
                db, aq.assessment_q_id, candidate_assessment_id,
            )
            if enough_cohort_data
            else None
        )

        question_info = QuestionInfo(order=position, type=question_bank.type)
        question_metrics = QuestionMetrics(
            active_time_ms=metrics.active_time_ms if metrics else 0,
            focus_loss_time_ms=metrics.focus_loss_time_ms if metrics else 0,
            paste_char_count=metrics.paste_char_count if metrics else 0,
            chars_alnum=metrics.chars_alnum if metrics else 0,
            chars_special=metrics.chars_special if metrics else 0,
            copy_char_count=metrics.copy_char_count if metrics else 0,
            copy_event_count=metrics.copy_event_count if metrics else 0,
        )

        score, entries = _score_and_factor_entries(
            question_info, question_metrics, cohort_avg_active_time_ms,
        )
        question_scores.append(score)
        question_weights.append(aq.approved_weight)
        contributing_factors.extend(sentence for _, sentence in entries)

        top_factor = (
            max(entries, key=lambda entry: entry[0])[1] if entries else None
        )
        per_question.append((position, score, top_factor))

    overall_score = round(
        _aggregate_question_scores(question_scores, question_weights)
    )

    notable_question = None
    if per_question:
        best_order, best_score, best_top_factor = max(
            per_question, key=lambda entry: entry[1],
        )
        if best_score > 30:
            notable_question = NotableQuestion(
                question_order=best_order,
                score=best_score,
                top_factor=best_top_factor,
            )

    return ReviewPriorityResponse(
        score=overall_score,
        band=band_for_score(overall_score),
        contributing_factors=contributing_factors,
        notable_question=notable_question,
    )
