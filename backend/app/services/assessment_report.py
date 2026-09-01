from sqlalchemy import case, func
from sqlalchemy.orm import Session
from app.models.assessment import Assessment
from app.models.assessment_question import AssessmentQuestion
from app.models.candidate_response import CandidateResponse, CorrectnessStatus
from app.schema.dashboard import QuestionQualityBucket, QuestionQualityResponse


def build_question_quality_guidance(buckets: list[QuestionQualityBucket]) -> list[str]:
    guidance: list[str] = []

    for bucket in buckets:
        if bucket.count == 0:
            continue

        match bucket.bucket:
            case "needs_revision":
                guidance.append(
                    f"{bucket.count} question{'s' if bucket.count != 1 else ''} have fallen below 30% success and should be reviewed."
                )
            case "too_easy":
                guidance.append(
                    f"{bucket.count} question{'s' if bucket.count != 1 else ''} are performing above 95% success and may be too easy."
                )
            case "thin_sample":
                guidance.append(
                    f"{bucket.count} question{'s' if bucket.count != 1 else ''} have fewer than 3 attempts and need more data before judging quality."
                )
            case "balanced":
                guidance.append(
                    f"{bucket.count} question{'s' if bucket.count != 1 else ''} are in the balanced range and appear healthy."
                )
            case _:
                pass

    return guidance

