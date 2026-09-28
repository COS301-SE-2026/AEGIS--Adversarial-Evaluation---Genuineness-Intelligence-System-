import os
from unittest.mock import MagicMock, patch

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

    mock_client_cls.assert_called_once_with(api_key="test-gemini-key")
    assert result == "the-real-sdk-client"


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
        "sys", "user", "gemini-3.1-flash-lite"
    )
    mock_openrouter.assert_not_called()


def test_call_llm_falls_back_to_openrouter_on_api_error():
    api_error = _mock_api_error(429)
    fallback_models = ["qwen/qwen3.8-27b:free", "nvidia/nemotron-3.5-lightning:free"]

    with patch(
        "app.core.gemini._call_gemini", side_effect=api_error
    ), patch(
        "app.core.gemini.call_openrouter",
        return_value=('{"a": 2}', "nvidia/nemotron-3.5-lightning:free"),
    ) as mock_openrouter, patch(
        "app.core.gemini.settings.openrouter_models",
        fallback_models,
    ):
        text, served_by = call_llm("sys", "user", "gemini-3.1-flash-lite")

    assert text == '{"a": 2}'
    assert served_by == "nvidia/nemotron-3.5-lightning:free"
    mock_openrouter.assert_called_once_with(
        "sys", "user", fallback_models
    )


def test_call_llm_falls_back_to_openrouter_on_connection_error():
    with patch(
        "app.core.gemini._call_gemini",
        side_effect=requests.exceptions.ConnectionError("unreachable"),
    ), patch(
        "app.core.gemini.call_openrouter",
        return_value=('{"a": 3}', "qwen/qwen3.8-27b:free"),
    ) as mock_openrouter:
        text, served_by = call_llm("sys", "user", "gemini-3.1-flash-lite")

    assert text == '{"a": 3}'
    assert served_by == "qwen/qwen3.8-27b:free"
    mock_openrouter.assert_called_once()


def test_call_llm_falls_back_to_openrouter_on_timeout():
    with patch(
        "app.core.gemini._call_gemini",
        side_effect=requests.exceptions.Timeout("too slow"),
    ), patch(
        "app.core.gemini.call_openrouter",
        return_value=('{"a": 4}', "qwen/qwen3.8-27b:free"),
    ):
        text, _ = call_llm("sys", "user", "gemini-3.1-flash-lite")

    assert text == '{"a": 4}'


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
