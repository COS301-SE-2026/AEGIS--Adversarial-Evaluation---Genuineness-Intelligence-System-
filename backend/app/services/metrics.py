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
        # get_metrics_for_response(db, 1),
        # get_metrics_for_response(db, 2),
        # get_metrics_for_response(db, 3),
        # commented out for fixture data that represents different states
        CandidateMetricsResponse(
            candidate_response_id=1,
            active_time_ms=184300,
            unique_keys_count=27,
            chars_alnum=200,
            chars_special=44,
            backspace_count=38,
            copy_event_count=1,
            paste_event_count=2,
            paste_char_count=340,
            focus_loss_count=1,
            focus_loss_time_ms=8000,
        ),
        # above: row 2 — frequent tab-switching (focus_loss_count=4 >= 3)
        # paste clean
        CandidateMetricsResponse(
            candidate_response_id=2,
            active_time_ms=210500,
            unique_keys_count=35,
            chars_alnum=600,
            chars_special=20,
            backspace_count=45,
            copy_event_count=0,
            paste_event_count=0,
            paste_char_count=0,
            focus_loss_count=4,
            focus_loss_time_ms=15000,
        ),
        # above: row 3 — no flags, clean on both thresholds
        CandidateMetricsResponse(
            candidate_response_id=3,
            active_time_ms=145000,
            unique_keys_count=42,
            chars_alnum=350,
            chars_special=24,
            backspace_count=15,
            copy_event_count=0,
            paste_event_count=0,
            paste_char_count=0,
            focus_loss_count=1,
            focus_loss_time_ms=4500,
        ),
    ]
