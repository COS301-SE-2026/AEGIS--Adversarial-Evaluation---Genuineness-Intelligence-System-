from datetime import datetime, timezone

import pytest
from pydantic import ValidationError

from app.schema.candidate_response_metrics import (
    CandidateResponseMetricsResponse,
    MetricsCumulative,
    MetricsDelta,
    MetricsFlushRequest,
    MetricsFlushResponse,
)


def _valid_delta_kwargs():
    return dict(
        active_time_ms=1000,
        chars_alnum=10,
        chars_special=2,
        backspace_count=1,
        copy_event_count=0,
        copy_char_count=0,
        paste_event_count=0,
        paste_char_count=0,
        focus_loss_count=0,
        focus_loss_time_ms=0,
    )


def test_metrics_delta_accepts_valid_values():
    delta = MetricsDelta(**_valid_delta_kwargs())

    assert delta.active_time_ms == 1000
    assert delta.chars_alnum == 10


@pytest.mark.parametrize("field", list(_valid_delta_kwargs().keys()))
def test_metrics_delta_rejects_negative_values(field):
    kwargs = _valid_delta_kwargs()
    kwargs[field] = -1

    with pytest.raises(ValidationError):
        MetricsDelta(**kwargs)


def test_metrics_delta_requires_all_fields():
    with pytest.raises(ValidationError):
        MetricsDelta(active_time_ms=1000)


def test_metrics_cumulative_accepts_non_negative_value():
    cumulative = MetricsCumulative(unique_keys_count=42)

    assert cumulative.unique_keys_count == 42


def test_metrics_cumulative_rejects_negative_value():
    with pytest.raises(ValidationError):
        MetricsCumulative(unique_keys_count=-1)


def test_metrics_flush_request_builds_from_nested_objects():
    request = MetricsFlushRequest(
        candidate_assessment_id=7,
        delta=MetricsDelta(**_valid_delta_kwargs()),
        cumulative=MetricsCumulative(unique_keys_count=5),
    )

    assert request.candidate_assessment_id == 7
    assert request.delta.active_time_ms == 1000
    assert request.cumulative.unique_keys_count == 5


def test_metrics_flush_request_rejects_missing_delta():
    with pytest.raises(ValidationError):
        MetricsFlushRequest(
            candidate_assessment_id=7,
            cumulative=MetricsCumulative(unique_keys_count=5),
        )


def test_metrics_flush_response_round_trips_from_orm_object():
    class FakeOrmRow:
        candidate_response_id = 3
        updated_at = datetime(2026, 8, 19, tzinfo=timezone.utc)

    response = MetricsFlushResponse.model_validate(
        FakeOrmRow(), from_attributes=True
    )

    assert response.candidate_response_id == 3
    assert response.updated_at == datetime(2026, 8, 19, tzinfo=timezone.utc)


def test_candidate_response_metrics_response_round_trips_from_orm_object():
    class FakeOrmRow:
        candidate_response_id = 3
        active_time_ms = 1000
        unique_keys_count = 42
        chars_alnum = 10
        chars_special = 2
        backspace_count = 1
        copy_event_count = 0
        copy_char_count = 0
        paste_event_count = 0
        paste_char_count = 0
        focus_loss_count = 0
        focus_loss_time_ms = 0

    response = CandidateResponseMetricsResponse.model_validate(
        FakeOrmRow(), from_attributes=True
    )

    assert response.candidate_response_id == 3
    assert response.active_time_ms == 1000
    assert response.unique_keys_count == 42
    assert response.copy_char_count == 0
