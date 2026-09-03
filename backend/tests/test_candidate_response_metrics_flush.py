from datetime import datetime
from unittest.mock import MagicMock


def _make_response_record(response_id=77, candidate_id=5):
    response_record = MagicMock()
    response_record.response_id = response_id
    response_record.candidate_assessment = MagicMock()
    response_record.candidate_assessment.candidate_id = candidate_id
    return response_record


def _make_existing_metrics(unique_keys_count=5):
    metrics = MagicMock()
    metrics.candidate_response_id = 77
    metrics.active_time_ms = 1000
    metrics.chars_alnum = 10
    metrics.chars_special = 2
    metrics.backspace_count = 1
    metrics.copy_event_count = 0
    metrics.copy_char_count = 0
    metrics.paste_event_count = 0
    metrics.paste_char_count = 0
    metrics.focus_loss_count = 0
    metrics.focus_loss_time_ms = 0
    metrics.unique_keys_count = unique_keys_count
    return metrics


def _stub_lookup_queries(mock_db, response_record, metrics_record):
    mock_db.query.side_effect = [
        MagicMock(
            **{"filter.return_value.first.return_value": response_record}
        ),
        MagicMock(
            **{"filter.return_value.first.return_value": metrics_record}
        ),
    ]


def _flush_payload(**delta_overrides):
    delta = dict(
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
    delta.update(delta_overrides)
    return {
        "candidate_assessment_id": 42,
        "delta": delta,
        "cumulative": {"unique_keys_count": 5},
    }


def test_first_flush_creates_row_with_starting_values(
    candidate_client, mock_db
):
    response_record = _make_response_record()
    _stub_lookup_queries(mock_db, response_record, None)

    created = {}

    def fake_add(obj):
        created["metrics"] = obj

    def fake_refresh(obj):
        obj.updated_at = datetime(2026, 8, 19, 12, 0, 0)

    mock_db.add.side_effect = fake_add
    mock_db.refresh.side_effect = fake_refresh

    response = candidate_client.post(
        "/api/v1/candidate-responses/77/metrics/flush",
        json=_flush_payload(),
    )

    assert response.status_code == 200
    body = response.json()
    assert body["candidate_response_id"] == 77

    metrics = created["metrics"]
    assert metrics.candidate_response_id == 77
    assert metrics.candidate_assessment_id == 42
    assert metrics.active_time_ms == 1000
    assert metrics.chars_alnum == 10
    assert metrics.chars_special == 2
    assert metrics.backspace_count == 1
    assert metrics.copy_char_count == 0
    assert metrics.unique_keys_count == 5
    mock_db.commit.assert_called_once()


def test_second_flush_adds_delta_onto_existing_values(
    candidate_client, mock_db
):
    response_record = _make_response_record()
    existing_metrics = _make_existing_metrics()
    _stub_lookup_queries(mock_db, response_record, existing_metrics)

    response = candidate_client.post(
        "/api/v1/candidate-responses/77/metrics/flush",
        json=_flush_payload(active_time_ms=500, chars_alnum=4),
    )

    assert response.status_code == 200
    assert existing_metrics.active_time_ms == 1500
    assert existing_metrics.chars_alnum == 14
    assert existing_metrics.chars_special == 4
    assert existing_metrics.backspace_count == 2
    mock_db.add.assert_not_called()
    mock_db.commit.assert_called_once()


def test_flush_with_copy_char_count_adds_onto_existing_value(
    candidate_client, mock_db
):
    response_record = _make_response_record()
    existing_metrics = _make_existing_metrics()
    existing_metrics.copy_char_count = 25
    _stub_lookup_queries(mock_db, response_record, existing_metrics)

    response = candidate_client.post(
        "/api/v1/candidate-responses/77/metrics/flush",
        json=_flush_payload(copy_char_count=17),
    )

    assert response.status_code == 200
    assert existing_metrics.copy_char_count == 42
    mock_db.add.assert_not_called()
    mock_db.commit.assert_called_once()


def test_flush_with_lower_unique_keys_count_does_not_decrease_it(
    candidate_client, mock_db
):
    response_record = _make_response_record()
    existing_metrics = _make_existing_metrics(unique_keys_count=20)
    _stub_lookup_queries(mock_db, response_record, existing_metrics)

    payload = _flush_payload()
    payload["cumulative"]["unique_keys_count"] = 3

    response = candidate_client.post(
        "/api/v1/candidate-responses/77/metrics/flush",
        json=payload,
    )

    assert response.status_code == 200
    assert existing_metrics.unique_keys_count == 20


def test_flush_returns_403_for_response_owned_by_other_candidate(
    candidate_client, mock_db
):
    response_record = _make_response_record(candidate_id=99)
    mock_db.query.return_value.filter.return_value.first.return_value = (
        response_record
    )

    response = candidate_client.post(
        "/api/v1/candidate-responses/77/metrics/flush",
        json=_flush_payload(),
    )

    assert response.status_code == 403
    assert response.json() == {
        "detail": "Not authenticated for this assessment"
    }
    mock_db.commit.assert_not_called()


def test_flush_returns_404_for_missing_response(candidate_client, mock_db):
    mock_db.query.return_value.filter.return_value.first.return_value = None

    response = candidate_client.post(
        "/api/v1/candidate-responses/999/metrics/flush",
        json=_flush_payload(),
    )

    assert response.status_code == 404
    assert response.json() == {"detail": "Response not found"}
