from sqlalchemy import case, func
from sqlalchemy.orm import Session
from app.models.assessment import Assessment
from app.models.assessment_question import AssessmentQuestion
from app.models.candidate_response import CandidateResponse, CorrectnessStatus
from app.schema.dashboard import (
    QuestionQualityBucket,
    QuestionQualityResponse,
)


def build_question_quality_guidance(
    buckets: list[QuestionQualityBucket],
) -> list[str]:
    guidance: list[str] = []

    for bucket in buckets:
        if bucket.count == 0:
            continue

        match bucket.bucket:
            case "needs_revision":
                guidance.append(
                    (
                        f"{bucket.count} question"
                        f"{'s' if bucket.count != 1 else ''} have fallen "
                        "below 30% success and should be reviewed."
                    )
                )
            case "too_easy":
                guidance.append(
                    (
                        f"{bucket.count} question"
                        f"{'s' if bucket.count != 1 else ''} are performing "
                        "above 95% success and may be too easy."
                    )
                )
            case "thin_sample":
                guidance.append(
                    (
                        f"{bucket.count} question"
                        f"{'s' if bucket.count != 1 else ''} have fewer "
                        "than 3 attempts and need more data before judging "
                        "quality."
                    )
                )
            case "balanced":
                guidance.append(
                    (
                        f"{bucket.count} question"
                        f"{'s' if bucket.count != 1 else ''} are in the "
                        "balanced range and appear healthy."
                    )
                )
            case _:
                pass

    return guidance


def get_question_quality(db: Session) -> QuestionQualityResponse:
    rows = (
        db.query(
            AssessmentQuestion.adv_question_id.label("adversarial_question_id"),
            func.count(CandidateResponse.response_id).label("attempt_count"),
            func.sum(
                case(
                    (CandidateResponse.is_correct == CorrectnessStatus.CORRECT, 1),
                    else_=0,
                )
            ).label("correct_count"),
        )
        .join(
            Assessment,
            Assessment.assessment_id == AssessmentQuestion.assessments_id,
        )
        .outerjoin(
            CandidateResponse,
            CandidateResponse.assessment_question_id
            == AssessmentQuestion.assessment_q_id,
        )
        .group_by(AssessmentQuestion.adv_question_id)
        .all()
    )

    question_buckets: dict[str, list[int]] = {
        "needs_revision": [],
        "balanced": [],
        "too_easy": [],
        "thin_sample": [],
    }

    for row in rows:
        adversarial_question_id = int(row.adversarial_question_id)
        attempt_count = int(row.attempt_count or 0)
        correct_count = int(row.correct_count or 0)
        success_rate = (
            (correct_count / attempt_count) * 100 if attempt_count else 0.0
        )

        if attempt_count < 3:
            bucket = "thin_sample"
        elif success_rate < 30:
            bucket = "needs_revision"
        elif success_rate > 95:
            bucket = "too_easy"
        else:
            bucket = "balanced"

        question_buckets[bucket].append(adversarial_question_id)

    ordered_bucket_names = [
        "needs_revision",
        "balanced",
        "too_easy",
        "thin_sample",
    ]

    buckets = [
        QuestionQualityBucket(
            bucket=bucket_name,
            count=len(question_buckets[bucket_name]),
            question_ids=question_buckets[bucket_name],
        )
        for bucket_name in ordered_bucket_names
    ]
    total_questions_answered = sum(bucket.count for bucket in buckets)

    return QuestionQualityResponse(
        total_questions_answered=total_questions_answered,
        buckets=buckets,
        guidance=build_question_quality_guidance(buckets),
    )
