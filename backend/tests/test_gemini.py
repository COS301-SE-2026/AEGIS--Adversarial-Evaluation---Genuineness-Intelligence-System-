import os
import threading
from unittest.mock import MagicMock, patch

import httpx
import pytest
import requests
from google.genai import errors as genai_errors

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-client-id")
os.environ.setdefault("GOOGLE_CLIENT_SECRET", "test-client-secret")
os.environ.setdefault("GOOGLE_REDIRECT_URI", "http://localhost:8000/callback")

from app.core.gemini import (
    LLMProviderError,
    _breaker,
    _call_gemini,
    call_llm,
    get_gemini_client,
)
from app.core.openrouter import OpenRouterError


def _mock_api_error(status_code, error_cls=genai_errors.ClientError):
    response = MagicMock(spec=requests.Response)
    response.json.return_value = {"error": {"message": "boom"}}
    return error_cls(status_code, response)


def test_get_gemini_client_constructs_with_configured_api_key():
    with patch(
        "app.core.gemini.settings.gemini_api_key", "test-gemini-key"
    ), patch("app.core.gemini.genai.Client") as mock_client_cls:
        mock_client_cls.return_value = "the-real-sdk-client"
        result = get_gemini_client()

    mock_client_cls.assert_called_once()
    call_kwargs = mock_client_cls.call_args.kwargs
    assert call_kwargs["api_key"] == "test-gemini-key"
    assert result == "the-real-sdk-client"


def test_get_gemini_client_sets_request_timeout_in_milliseconds():
    with patch(
        "app.core.gemini.settings.gemini_timeout_seconds", 7
    ), patch("app.core.gemini.genai.Client") as mock_client_cls:
        get_gemini_client()

    http_options = mock_client_cls.call_args.kwargs["http_options"]
    assert http_options.timeout == 7000


def test_call_gemini_passes_through_config_and_returns_response_text():
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = MagicMock(
        text='{"weaponised_question": "What does f(6) return?"}',
    )

    with patch(
        "app.core.gemini.get_gemini_client", return_value=mock_client
    ) as mock_get_client:
        result = _call_gemini(
            "system instruction text",
            "user contents text",
            "gemini-3.1-flash-lite",
        )

    mock_get_client.assert_called_once_with()
    assert result == '{"weaponised_question": "What does f(6) return?"}'

    call_kwargs = mock_client.models.generate_content.call_args.kwargs
    assert call_kwargs["model"] == "gemini-3.1-flash-lite"
    assert call_kwargs["contents"] == "user contents text"
    config = call_kwargs["config"]
    assert config.system_instruction == "system instruction text"
    assert config.temperature == 0.0
    assert config.response_mime_type == "application/json"


def test_call_gemini_text_mode_does_not_force_json_response_type():
    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = MagicMock(
        text="plain summary",
    )

    with patch(
        "app.core.gemini.get_gemini_client", return_value=mock_client
    ):
        result = _call_gemini(
            "system instruction text",
            "user contents text",
            "gemini-3.1-flash-lite",
            json_mode=False,
        )

    assert result == "plain summary"
    config = mock_client.models.generate_content.call_args.kwargs["config"]
    assert config.response_mime_type is None
    assert config.temperature == 0.0


def test_call_llm_text_mode_passes_json_mode_false_to_both_providers():
    with patch(
        "app.core.gemini._call_gemini",
        side_effect=_mock_api_error(429),
    ) as mock_gemini, patch(
        "app.core.gemini.call_openrouter",
        return_value=("plain text", "google/gemini-2.5-flash-lite"),
    ) as mock_openrouter, patch(
        "app.core.gemini.settings.openrouter_model",
        "google/gemini-2.5-flash-lite",
    ):
        text, served_by = call_llm(
            "sys", "user", "gemini-3.1-flash-lite", json_mode=False
        )

    assert text == "plain text"
    assert served_by == "google/gemini-2.5-flash-lite"
    mock_gemini.assert_called_once_with(
        "sys", "user", "gemini-3.1-flash-lite", False
    )
    mock_openrouter.assert_called_once_with(
        "sys", "user", "google/gemini-2.5-flash-lite", False
    )


def test_call_llm_gemini_succeeds_skips_openrouter():
    with patch(
        "app.core.gemini._call_gemini",
        return_value='{"a": 1}',
    ) as mock_gemini, patch(
        "app.core.gemini.call_openrouter"
    ) as mock_openrouter:
        text, served_by = call_llm("sys", "user", "gemini-3.1-flash-lite")

    assert text == '{"a": 1}'
    assert served_by == "gemini-3.1-flash-lite"
    mock_gemini.assert_called_once_with(
        "sys", "user", "gemini-3.1-flash-lite", True
    )
    mock_openrouter.assert_not_called()


def test_call_llm_falls_back_to_openrouter_on_api_error():
    api_error = _mock_api_error(429)
    fallback_model = "google/gemini-2.5-flash-lite"

    with patch(
        "app.core.gemini._call_gemini", side_effect=api_error
    ), patch(
        "app.core.gemini.call_openrouter",
        return_value=('{"a": 2}', "google/gemini-2.5-flash-lite"),
    ) as mock_openrouter, patch(
        "app.core.gemini.settings.openrouter_model",
        fallback_model,
    ):
        text, served_by = call_llm("sys", "user", "gemini-3.1-flash-lite")

    assert text == '{"a": 2}'
    assert served_by == "google/gemini-2.5-flash-lite"
    mock_openrouter.assert_called_once_with(
        "sys", "user", fallback_model, True
    )


def test_call_llm_falls_back_to_openrouter_on_connection_error():
    with patch(
        "app.core.gemini._call_gemini",
        side_effect=requests.exceptions.ConnectionError("unreachable"),
    ), patch(
        "app.core.gemini.call_openrouter",
        return_value=('{"a": 3}', "google/gemini-2.5-flash-lite"),
    ) as mock_openrouter:
        text, served_by = call_llm("sys", "user", "gemini-3.1-flash-lite")

    assert text == '{"a": 3}'
    assert served_by == "google/gemini-2.5-flash-lite"
    mock_openrouter.assert_called_once()


def test_call_llm_falls_back_to_openrouter_on_timeout():
    with patch(
        "app.core.gemini._call_gemini",
        side_effect=requests.exceptions.Timeout("too slow"),
    ), patch(
        "app.core.gemini.call_openrouter",
        return_value=('{"a": 4}', "google/gemini-2.5-flash-lite"),
    ):
        text, _ = call_llm("sys", "user", "gemini-3.1-flash-lite")

    assert text == '{"a": 4}'


def test_call_llm_falls_back_to_openrouter_on_httpx_timeout():
    with patch(
        "app.core.gemini._call_gemini",
        side_effect=httpx.ReadTimeout("gemini hung"),
    ), patch(
        "app.core.gemini.call_openrouter",
        return_value=('{"a": 5}', "google/gemini-2.5-flash-lite"),
    ) as mock_openrouter:
        text, served_by = call_llm("sys", "user", "gemini-3.1-flash-lite")

    assert text == '{"a": 5}'
    assert served_by == "google/gemini-2.5-flash-lite"
    mock_openrouter.assert_called_once()


def test_call_llm_raises_when_gemini_times_out_and_fallback_fails():
    with patch(
        "app.core.gemini._call_gemini",
        side_effect=httpx.ReadTimeout("gemini hung"),
    ), patch(
        "app.core.gemini.call_openrouter",
        side_effect=OpenRouterError("timed out"),
    ):
        with pytest.raises(LLMProviderError):
            call_llm("sys", "user", "gemini-3.1-flash-lite")


def test_call_llm_raises_when_both_providers_fail():
    api_error = _mock_api_error(500, genai_errors.ServerError)

    with patch(
        "app.core.gemini._call_gemini", side_effect=api_error
    ), patch(
        "app.core.gemini.call_openrouter",
        side_effect=OpenRouterError("openrouter down"),
    ):
        with pytest.raises(LLMProviderError) as exc_info:
            call_llm("sys", "user", "gemini-3.1-flash-lite")

    assert "gemini" in str(exc_info.value)
    assert "openrouter" in str(exc_info.value)
    assert "openrouter down" in str(exc_info.value)


def test_call_llm_malformed_json_from_gemini_does_not_fall_back():
    with patch(
        "app.core.gemini._call_gemini",
        return_value="not valid json",
    ), patch(
        "app.core.gemini.call_openrouter"
    ) as mock_openrouter:
        text, served_by = call_llm("sys", "user", "gemini-3.1-flash-lite")

    assert text == "not valid json"
    assert served_by == "gemini-3.1-flash-lite"
    mock_openrouter.assert_not_called()


def test_call_llm_does_not_fall_back_on_unrelated_exception():
    with patch(
        "app.core.gemini._call_gemini",
        side_effect=ValueError("unrelated bug"),
    ), patch(
        "app.core.gemini.call_openrouter"
    ) as mock_openrouter:
        with pytest.raises(ValueError):
            call_llm("sys", "user", "gemini-3.1-flash-lite")

    mock_openrouter.assert_not_called()


def test_call_llm_without_fallback_raises_on_gemini_timeout():
    with patch(
        "app.core.gemini._call_gemini",
        side_effect=httpx.ReadTimeout("gemini hung"),
    ), patch(
        "app.core.gemini.call_openrouter"
    ) as mock_openrouter:
        with pytest.raises(LLMProviderError) as exc_info:
            call_llm(
                "sys", "user", "gemini-3.1-flash-lite",
                allow_fallback=False,
            )

    assert "gemini" in str(exc_info.value)
    mock_openrouter.assert_not_called()


def test_call_llm_without_fallback_still_returns_gemini_success():
    with patch(
        "app.core.gemini._call_gemini", return_value='{"a": 6}'
    ):
        text, served_by = call_llm(
            "sys", "user", "gemini-3.1-flash-lite", allow_fallback=False
        )

    assert text == '{"a": 6}'
    assert served_by == "gemini-3.1-flash-lite"


_MODEL = "gemini-3.1-flash-lite"
_BACKUP = ("{\"b\": 1}", "google/gemini-2.5-flash-lite")


def _fail_gemini(count, exc):
    with patch(
        "app.core.gemini._call_gemini", side_effect=exc
    ) as mock_gemini:
        for _ in range(count):
            call_llm("sys", "user", _MODEL)
    return mock_gemini


def test_breaker_opens_after_consecutive_outage_failures():
    with patch(
        "app.core.gemini.call_openrouter", return_value=_BACKUP
    ):
        mock_gemini = _fail_gemini(3, httpx.ReadTimeout("hung"))

    assert mock_gemini.call_count == 3
    assert _breaker.state == "open"


def test_breaker_stays_closed_below_threshold():
    with patch(
        "app.core.gemini.call_openrouter", return_value=_BACKUP
    ):
        _fail_gemini(2, httpx.ReadTimeout("hung"))

    assert _breaker.state == "closed"


def test_breaker_ignores_non_outage_failures():
    with patch(
        "app.core.gemini.call_openrouter", return_value=_BACKUP
    ):
        _fail_gemini(6, _mock_api_error(400))

    assert _breaker.state == "closed"


def test_breaker_ignores_bad_model_output():
    with patch(
        "app.core.gemini._call_gemini", return_value="not json"
    ):
        for _ in range(6):
            text, _ = call_llm("sys", "user", _MODEL)

    assert text == "not json"
    assert _breaker.state == "closed"


def test_breaker_success_resets_failure_counter():
    with patch(
        "app.core.gemini.call_openrouter", return_value=_BACKUP
    ):
        _fail_gemini(2, httpx.ReadTimeout("hung"))
        with patch("app.core.gemini._call_gemini", return_value="{}"):
            call_llm("sys", "user", _MODEL)
        _fail_gemini(2, httpx.ReadTimeout("hung"))

    assert _breaker.state == "closed"


@pytest.mark.parametrize("code", [401, 403, 429, 500, 503])
def test_breaker_counts_status_code_outage_failures(code):
    error_cls = (
        genai_errors.ServerError
        if code >= 500
        else genai_errors.ClientError
    )
    with patch(
        "app.core.gemini.call_openrouter", return_value=_BACKUP
    ):
        _fail_gemini(3, _mock_api_error(code, error_cls))

    assert _breaker.state == "open"


def test_breaker_counts_connection_errors():
    with patch(
        "app.core.gemini.call_openrouter", return_value=_BACKUP
    ):
        _fail_gemini(3, requests.exceptions.ConnectionError("down"))

    assert _breaker.state == "open"


def test_open_breaker_skips_gemini_and_uses_openrouter():
    with patch(
        "app.core.gemini.call_openrouter", return_value=_BACKUP
    ) as mock_openrouter:
        _fail_gemini(3, httpx.ReadTimeout("hung"))
        with patch("app.core.gemini._call_gemini") as mock_gemini:
            result = call_llm("sys", "user", _MODEL)

    assert result == _BACKUP
    mock_gemini.assert_not_called()
    assert mock_openrouter.call_count == 4


def test_breaker_probe_after_cooldown_closes_on_success():
    clock = [100.0]
    with patch(
        "app.core.gemini._monotonic", side_effect=lambda: clock[0]
    ), patch("app.core.gemini.call_openrouter", return_value=_BACKUP):
        _fail_gemini(3, httpx.ReadTimeout("hung"))
        clock[0] = 130.0
        with patch("app.core.gemini._call_gemini") as mock_gemini:
            call_llm("sys", "user", _MODEL)
        mock_gemini.assert_not_called()
        assert _breaker.state == "open"

        clock[0] = 161.0
        with patch(
            "app.core.gemini._call_gemini", return_value="{}"
        ) as mock_gemini:
            text, served_by = call_llm("sys", "user", _MODEL)

    assert text == "{}"
    assert served_by == _MODEL
    mock_gemini.assert_called_once()
    assert _breaker.state == "closed"


def test_breaker_failed_probe_reopens_with_fresh_cooldown():
    clock = [100.0]
    with patch(
        "app.core.gemini._monotonic", side_effect=lambda: clock[0]
    ), patch("app.core.gemini.call_openrouter", return_value=_BACKUP):
        _fail_gemini(3, httpx.ReadTimeout("hung"))
        clock[0] = 161.0
        with patch(
            "app.core.gemini._call_gemini",
            side_effect=httpx.ReadTimeout("hung"),
        ) as mock_gemini:
            call_llm("sys", "user", _MODEL)
        mock_gemini.assert_called_once()
        assert _breaker.state == "open"

        clock[0] = 200.0
        with patch("app.core.gemini._call_gemini") as mock_gemini:
            call_llm("sys", "user", _MODEL)
        mock_gemini.assert_not_called()

        clock[0] = 222.0
        with patch(
            "app.core.gemini._call_gemini", return_value="{}"
        ) as mock_gemini:
            call_llm("sys", "user", _MODEL)

    mock_gemini.assert_called_once()
    assert _breaker.state == "closed"


def test_half_open_sends_only_one_concurrent_call_to_gemini():
    clock = [100.0]
    started = threading.Event()
    release = threading.Event()
    results = []

    def slow_gemini(*args, **kwargs):
        started.set()
        release.wait(timeout=5)
        return "{}"

    with patch(
        "app.core.gemini._monotonic", side_effect=lambda: clock[0]
    ), patch(
        "app.core.gemini.call_openrouter", return_value=_BACKUP
    ) as mock_openrouter:
        _fail_gemini(3, httpx.ReadTimeout("hung"))
        openrouter_calls_before = mock_openrouter.call_count
        clock[0] = 161.0
        with patch(
            "app.core.gemini._call_gemini", side_effect=slow_gemini
        ) as mock_gemini:
            probe = threading.Thread(
                target=lambda: results.append(
                    call_llm("sys", "user", _MODEL)
                )
            )
            probe.start()
            assert started.wait(timeout=5)
            other = call_llm("sys", "user", _MODEL)
            release.set()
            probe.join(timeout=5)

    assert other == _BACKUP
    assert mock_gemini.call_count == 1
    assert mock_openrouter.call_count == openrouter_calls_before + 1
    assert results == [("{}", _MODEL)]
    assert _breaker.state == "closed"


def test_force_backup_ai_skips_gemini():
    with patch(
        "app.core.gemini.settings.force_backup_ai", True
    ), patch(
        "app.core.gemini._call_gemini"
    ) as mock_gemini, patch(
        "app.core.gemini.call_openrouter", return_value=_BACKUP
    ) as mock_openrouter:
        result = call_llm("sys", "user", _MODEL)

    assert result == _BACKUP
    mock_gemini.assert_not_called()
    mock_openrouter.assert_called_once()
    assert _breaker.state == "closed"


def test_open_breaker_with_openrouter_failure_raises_and_keeps_state():
    with patch(
        "app.core.gemini.call_openrouter", return_value=_BACKUP
    ):
        _fail_gemini(3, httpx.ReadTimeout("hung"))

    with patch(
        "app.core.gemini.call_openrouter",
        side_effect=OpenRouterError("openrouter down"),
    ), patch("app.core.gemini._call_gemini") as mock_gemini:
        with pytest.raises(LLMProviderError) as exc_info:
            call_llm("sys", "user", _MODEL)

    mock_gemini.assert_not_called()
    assert "openrouter down" in str(exc_info.value)
    assert _breaker.state == "open"


def test_openrouter_failures_do_not_trip_breaker():
    with patch(
        "app.core.gemini._call_gemini",
        side_effect=_mock_api_error(400),
    ), patch(
        "app.core.gemini.call_openrouter",
        side_effect=OpenRouterError("openrouter down"),
    ):
        for _ in range(5):
            with pytest.raises(LLMProviderError):
                call_llm("sys", "user", _MODEL)

    assert _breaker.state == "closed"


def test_open_breaker_does_not_skip_gemini_without_fallback():
    with patch(
        "app.core.gemini.call_openrouter", return_value=_BACKUP
    ):
        _fail_gemini(3, httpx.ReadTimeout("hung"))

    with patch(
        "app.core.gemini._call_gemini", return_value="{}"
    ) as mock_gemini:
        text, served_by = call_llm(
            "sys", "user", _MODEL, allow_fallback=False
        )

    assert (text, served_by) == ("{}", _MODEL)
    mock_gemini.assert_called_once()
