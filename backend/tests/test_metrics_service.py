from unittest.mock import MagicMock

from app.schema.metrics import CandidateMetricsResponse
from app.services import metrics as metrics_service


def test_get_metrics_for_response_returns_metrics():
    result = metrics_service.get_metrics_for_response(
        MagicMock(),
        candidate_response_id=7,
    )

    assert isinstance(result, CandidateMetricsResponse)
    assert result.candidate_response_id == 7
    assert result.active_time_ms == 100000
    assert result.unique_keys_count == 27
    assert result.chars_alnum == 41
    assert result.chars_special == 44
    assert result.backspace_count == 33
    assert result.copy_event_count == 12
    assert result.paste_event_count == 24
    assert result.paste_char_count == 344
    assert result.focus_loss_count == 2
    assert result.focus_loss_time_ms == 2899


def test_get_metrics_for_assessment_returns_fixture_metrics():
    result = metrics_service.get_metrics_for_assessment(
        MagicMock(),
        candidate_assessment_id=7,
    )

    assert len(result) == 3
    assert all(isinstance(item, CandidateMetricsResponse) for item in result)
    assert [item.candidate_response_id for item in result] == [1, 2, 3]

    assert result[0].paste_char_count == 340
    assert result[0].focus_loss_count == 1

    assert result[1].paste_char_count == 0
    assert result[1].focus_loss_count == 4

    assert result[2].paste_char_count == 0
    assert result[2].focus_loss_count == 1