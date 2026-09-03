from unittest.mock import MagicMock

import pytest

from app.services.reporting_candidate_metrics import (
    get_metrics_radar,
    get_candidate_summed_metrics,
    get_cohort_summed_metrics,
    _sum_metrics_for_candidate_assessment,
    _compute_behavioral_ratios,
    _min_max_normalize,
)


@pytest.fixture
def mock_db():
    return MagicMock()


def test_compute_behavioral_ratios_basic_values():
    raw_metrics = {
        "paste_char_count": 50,
        "backspace_count": 10,
        "chars_alnum": 80,
        "chars_special": 20,
        "active_time_ms": 60_000,
        "focus_loss_time_ms": 6_000,
    }

    ratios = _compute_behavioral_ratios(raw_metrics)

    assert ratios["paste_ratio"] == pytest.approx(0.5)
    assert ratios["backspace_rate"] == pytest.approx(0.1)
    assert ratios["typing_speed"] == pytest.approx(100 / 60)
    assert ratios["focus_loss_rate"] == pytest.approx(0.1)


def test_compute_behavioral_ratios_clamps_paste_ratio_to_one():
    raw_metrics = {
        "paste_char_count": 500,
        "backspace_count": 0,
        "chars_alnum": 10,
        "chars_special": 0,
        "active_time_ms": 1000,
        "focus_loss_time_ms": 0,
    }

    ratios = _compute_behavioral_ratios(raw_metrics)

    assert ratios["paste_ratio"] == 1.0


def test_min_max_normalize_scales_into_zero_one_range():
    result = _min_max_normalize(5, [0, 5, 10])

    assert result == pytest.approx(0.5)


def test_min_max_normalize_returns_zero_when_all_values_equal():
    result = _min_max_normalize(3, [3, 3, 3])

    assert result == 0.0


def test_min_max_normalize_returns_zero_for_empty_cohort():
    result = _min_max_normalize(3, [])

    assert result == 0.0


def test_sum_metrics_for_candidate_assessment_builds_dict_from_row(mock_db):
    fake_row = MagicMock(
        paste_char_count=40,
        backspace_count=5,
        chars_alnum=90,
        chars_special=10,
        active_time_ms=100_000,
        focus_loss_time_ms=5_000,
    )
    mock_db.query.return_value.filter.return_value.one.return_value = fake_row

    result = _sum_metrics_for_candidate_assessment(
        mock_db, candidate_assessment_id=1
    )

    assert result == {
        "paste_char_count": 40,
        "backspace_count": 5,
        "chars_alnum": 90,
        "chars_special": 10,
        "active_time_ms": 100_000,
        "focus_loss_time_ms": 5_000,
    }


def test_sum_metrics_for_candidate_assessment_defaults_none_fields_to_zero(mock_db):
    fake_row = MagicMock(
        paste_char_count=None,
        backspace_count=None,
        chars_alnum=None,
        chars_special=None,
        active_time_ms=None,
        focus_loss_time_ms=None,
    )
    mock_db.query.return_value.filter.return_value.one.return_value = fake_row

    result = _sum_metrics_for_candidate_assessment(
        mock_db, candidate_assessment_id=1
    )

    assert result == {
        "paste_char_count": 0,
        "backspace_count": 0,
        "chars_alnum": 0,
        "chars_special": 0,
        "active_time_ms": 0,
        "focus_loss_time_ms": 0,
    }


def test_get_candidate_summed_metrics_delegates_to_sum_helper(
    mock_db, monkeypatch
):
    expected = {
        "paste_char_count": 1,
        "backspace_count": 2,
        "chars_alnum": 3,
        "chars_special": 4,
        "active_time_ms": 5,
        "focus_loss_time_ms": 6,
    }
    fake_sum = MagicMock(return_value=expected)
    monkeypatch.setattr(
        "app.services.reporting_candidate_metrics."
        "_sum_metrics_for_candidate_assessment",
        fake_sum,
    )

    result = get_candidate_summed_metrics(mock_db, candidate_assessment_id=7)

    fake_sum.assert_called_once_with(mock_db, 7)
    assert result == expected


def test_get_cohort_summed_metrics_excludes_target_and_filters_completed(
    mock_db, monkeypatch
):
    target_row = MagicMock(assessment_id=99)
    target_query = MagicMock()
    target_query.filter.return_value.one.return_value = target_row

    cohort_row_a = MagicMock(candidate_assess_id=101)
    cohort_row_b = MagicMock(candidate_assess_id=102)
    cohort_query = MagicMock()
    cohort_query.filter.return_value.all.return_value = [
        cohort_row_a,
        cohort_row_b,
    ]

    mock_db.query.side_effect = [target_query, cohort_query]

    fake_sum = MagicMock(side_effect=lambda db, cid: {"id": cid})
    monkeypatch.setattr(
        "app.services.reporting_candidate_metrics."
        "_sum_metrics_for_candidate_assessment",
        fake_sum,
    )

    result = get_cohort_summed_metrics(mock_db, candidate_assessment_id=1)

    assert result == [{"id": 101}, {"id": 102}]
    assert fake_sum.call_count == 2
    fake_sum.assert_any_call(mock_db, 101)
    fake_sum.assert_any_call(mock_db, 102)


def test_get_cohort_summed_metrics_returns_empty_list_when_no_peers(
    mock_db, monkeypatch
):
    target_row = MagicMock(assessment_id=99)
    target_query = MagicMock()
    target_query.filter.return_value.one.return_value = target_row

    cohort_query = MagicMock()
    cohort_query.filter.return_value.all.return_value = []

    mock_db.query.side_effect = [target_query, cohort_query]

    fake_sum = MagicMock()
    monkeypatch.setattr(
        "app.services.reporting_candidate_metrics."
        "_sum_metrics_for_candidate_assessment",
        fake_sum,
    )

    result = get_cohort_summed_metrics(mock_db, candidate_assessment_id=1)

    assert result == []
    fake_sum.assert_not_called()


def test_get_metrics_radar_flags_insufficient_cohort(mock_db, monkeypatch):
    candidate_raw = {
        "paste_char_count": 40,
        "backspace_count": 5,
        "chars_alnum": 90,
        "chars_special": 10,
        "active_time_ms": 100_000,
        "focus_loss_time_ms": 5_000,
    }

    monkeypatch.setattr(
        "app.services.reporting_candidate_metrics.get_candidate_summed_metrics",
        lambda db, candidate_assessment_id: candidate_raw,
    )
    monkeypatch.setattr(
        "app.services.reporting_candidate_metrics.get_cohort_summed_metrics",
        lambda db, candidate_assessment_id: [{}, {}],
    )

    result = get_metrics_radar(mock_db, candidate_assessment_id=1)

    assert result.insufficient_cohort_data is True
    assert result.cohort_sample_size == 2
    assert all(axis.cohort_avg_value == 0.0 for axis in result.axes)
    axis_names = {axis.axis for axis in result.axes}
    assert axis_names == {
        "paste_ratio",
        "backspace_rate",
        "typing_speed",
        "focus_loss_rate",
    }


def test_get_metrics_radar_computes_cohort_averages_with_sufficient_data(mock_db, monkeypatch):
    candidate_raw = {
        "paste_char_count": 40,
        "backspace_count": 5,
        "chars_alnum": 90,
        "chars_special": 10,
        "active_time_ms": 100_000,
        "focus_loss_time_ms": 5_000,
    }
    cohort_raw = [
        {
            "paste_char_count": 10,
            "backspace_count": 2,
            "chars_alnum": 90,
            "chars_special": 10,
            "active_time_ms": 100_000,
            "focus_loss_time_ms": 1_000,
        },
        {
            "paste_char_count": 20,
            "backspace_count": 3,
            "chars_alnum": 90,
            "chars_special": 10,
            "active_time_ms": 100_000,
            "focus_loss_time_ms": 2_000,
        },
        {
            "paste_char_count": 30,
            "backspace_count": 4,
            "chars_alnum": 90,
            "chars_special": 10,
            "active_time_ms": 100_000,
            "focus_loss_time_ms": 3_000,
        },
    ]

    monkeypatch.setattr(
        "app.services.reporting_candidate_metrics.get_candidate_summed_metrics",
        lambda db, candidate_assessment_id: candidate_raw,
    )
    monkeypatch.setattr(
        "app.services.reporting_candidate_metrics.get_cohort_summed_metrics",
        lambda db, candidate_assessment_id: cohort_raw,
    )

    result = get_metrics_radar(mock_db, candidate_assessment_id=1)

    assert result.insufficient_cohort_data is False
    assert result.cohort_sample_size == 3
    for axis in result.axes:
        assert 0.0 <= axis.candidate_value <= 1.0
        assert 0.0 <= axis.cohort_avg_value <= 1.0