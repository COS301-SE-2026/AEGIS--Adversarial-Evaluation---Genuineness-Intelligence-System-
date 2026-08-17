from app.schema.metrics import CandidateMetricsResponse
from sqlalchemy.orm import Session


def get_metrics_for_response(
        db: Session,
        candidate_response_id: int
) -> CandidateMetricsResponse:
    # replace this with real query data when the table has been built
    return CandidateMetricsResponse(
        candidate_response_id=candidate_response_id,
        active_time_ms=100000,
        unique_keys_count=27,
        chars_alnum=41,
        chars_special=44,
        backspace_count=33,
        copy_event_count=12,
        paste_event_count=24,
        paste_char_count=344,
        focus_loss_count=2,
        focus_loss_time_ms=2899
    )


def get_metrics_for_assessment(
        db: Session,
        candidate_assessment_id: int
) -> list[CandidateMetricsResponse]:
    return [
        get_metrics_for_response(db, 1),
        get_metrics_for_response(db, 2),
        get_metrics_for_response(db, 3),
    ]
