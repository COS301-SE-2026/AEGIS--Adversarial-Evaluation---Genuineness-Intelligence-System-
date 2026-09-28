import os
import time
from unittest.mock import MagicMock, patch
import httpx
import pytest
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-client-id")
os.environ.setdefault("GOOGLE_CLIENT_SECRET", "test-client-secret")
os.environ.setdefault("GOOGLE_REDIRECT_URI", "http://localhost:8000/callback")
from app.core.openrouter import (
    OpenRouterError,
    call_openrouter,
    extract_error_message,
)

_MODELS = [
    "qwen/qwen3.8-27b:free",
    "nvidia/nemotron-3.5-lightning:free",
    "nvidia/nemotron-3-ultra-550b-a55b:free",
]

def test_call_openrouter_missing_api_key_raises_clear_error():
    with patch(
        "app.core.openrouter.settings.openrouter_api_key", None
    ), patch("app.core.openrouter.httpx.Client") as mock_client_cls:
        with pytest.raises(OpenRouterError) as exc_info:
            call_openrouter("sys", "user", _MODELS)
    assert "OPENROUTER_API_KEY is not configured" in str(exc_info.value)
    mock_client_cls.assert_not_called()

def test_call_openrouter_sends_models_list_in_request_body():
    response = MagicMock()
    response.raise_for_status.return_value = None
    response.json.return_value = {
        "model": _MODELS[1],
        "choices": [{"message": {"content": '{"ok": true}'}}],
    }
    with patch(
        "app.core.openrouter.settings.openrouter_api_key", "test-key"
    ), patch("app.core.openrouter.httpx.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.post.return_value = response
        mock_client_cls.return_value.__enter__.return_value = mock_client
        call_openrouter("sys prompt", "user content", _MODELS)
    call_kwargs = mock_client.post.call_args.kwargs
    assert call_kwargs["json"]["models"] == _MODELS
    assert "model" not in call_kwargs["json"]
    assert call_kwargs["json"]["messages"][1] == {
        "role": "user",
        "content": "user content",
    }
    assert "sys prompt" in call_kwargs["json"]["messages"][0]["content"]
    assert "JSON only" in call_kwargs["json"]["messages"][0]["content"]

def test_call_openrouter_sets_max_tokens_in_request_body():
    response = MagicMock()
    response.raise_for_status.return_value = None
    response.json.return_value = {
        "model": _MODELS[0],
        "choices": [{"message": {"content": '{"ok": true}'}}],
    }
    with patch(
        "app.core.openrouter.settings.openrouter_api_key", "test-key"
    ), patch("app.core.openrouter.httpx.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.post.return_value = response
        mock_client_cls.return_value.__enter__.return_value = mock_client
        call_openrouter("sys prompt", "user content", _MODELS)
    call_kwargs = mock_client.post.call_args.kwargs
    assert call_kwargs["json"]["max_tokens"] == 1024
    assert isinstance(call_kwargs["json"]["max_tokens"], int)

def test_call_openrouter_raises_clear_timeout_error_on_hanging_request():
    def _hang(payload, headers):
        time.sleep(5)
        return {
            "model": _MODELS[0],
            "choices": [{"message": {"content": '{"ok": true}'}}],
        }

    with patch(
        "app.core.openrouter.settings.openrouter_api_key", "test-key"
    ), patch(
        "app.core.openrouter._post_to_openrouter", side_effect=_hang
    ), patch(
        "app.core.openrouter._REQUEST_TIMEOUT_SECONDS", 0.2
    ):
        start = time.monotonic()
        with pytest.raises(OpenRouterError) as exc_info:
            call_openrouter("sys prompt", "user content", _MODELS)
        elapsed = time.monotonic() - start
    assert "timed out" in str(exc_info.value)
    assert elapsed < 2

def test_call_openrouter_returns_content_and_served_by_from_response():
    response = MagicMock()
    response.raise_for_status.return_value = None
    response.json.return_value = {
        "model": _MODELS[2],
        "choices": [{"message": {"content": '{"ok": true}'}}],
    }
    with patch(
        "app.core.openrouter.settings.openrouter_api_key", "test-key"
    ), patch("app.core.openrouter.httpx.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.post.return_value = response
        mock_client_cls.return_value.__enter__.return_value = mock_client
        text, served_by = call_openrouter(
            "sys prompt", "user content", _MODELS
        )
    assert text == '{"ok": true}'
    assert served_by == _MODELS[2]
    assert served_by != _MODELS[0]

def test_call_openrouter_raises_when_model_field_missing():
    response = MagicMock()
    response.raise_for_status.return_value = None
    response.json.return_value = {
        "choices": [{"message": {"content": '{"ok": true}'}}]
    }
    with patch(
        "app.core.openrouter.settings.openrouter_api_key", "test-key"
    ), patch("app.core.openrouter.httpx.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.post.return_value = response
        mock_client_cls.return_value.__enter__.return_value = mock_client
        with pytest.raises(OpenRouterError) as exc_info:
            call_openrouter("sys prompt", "user content", _MODELS)
    assert "missing 'model' field" in str(exc_info.value)

def test_call_openrouter_http_status_error_raises_openrouter_error():
    request = httpx.Request(
        "POST", "https://openrouter.ai/api/v1/chat/completions"
    )
    response = httpx.Response(
        429,
        request=request,
        content=b'{"message":"rate limited"}',
    )
    with patch(
        "app.core.openrouter.settings.openrouter_api_key", "test-key"
    ), patch("app.core.openrouter.httpx.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.post.return_value = response
        mock_client_cls.return_value.__enter__.return_value = mock_client
        with pytest.raises(OpenRouterError) as exc_info:
            call_openrouter("sys", "user", _MODELS)
    assert str(exc_info.value) == "rate limited"

def test_call_openrouter_request_error_raises_openrouter_error():
    with patch(
        "app.core.openrouter.settings.openrouter_api_key", "test-key"
    ), patch("app.core.openrouter.httpx.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.post.side_effect = httpx.ConnectError("boom")
        mock_client_cls.return_value.__enter__.return_value = mock_client
        with pytest.raises(OpenRouterError) as exc_info:
            call_openrouter("sys", "user", _MODELS)
    assert "Unable to reach OpenRouter" in str(exc_info.value)

def test_call_openrouter_missing_choices_raises_openrouter_error():
    response = MagicMock()
    response.raise_for_status.return_value = None
    response.json.return_value = {"choices": []}
    with patch(
        "app.core.openrouter.settings.openrouter_api_key", "test-key"
    ), patch("app.core.openrouter.httpx.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.post.return_value = response
        mock_client_cls.return_value.__enter__.return_value = mock_client
        with pytest.raises(OpenRouterError) as exc_info:
            call_openrouter("sys", "user", _MODELS)
    assert "missing expected content" in str(exc_info.value)

def test_extract_error_message_uses_json_message():
    request = httpx.Request(
        "POST", "https://openrouter.ai/api/v1/chat/completions"
    )
    response = httpx.Response(
        400,
        request=request,
        content=b'{"message":"bad request"}',
    )
    assert extract_error_message(response) == "bad request"

def test_extract_error_message_for_json_parsing_fail():
    response = MagicMock()
    response.json.side_effect = ValueError()
    response.text = "detailed error"
    assert extract_error_message(response) == "detailed error"

def test_extract_error_message_for_empty_text():
    response = MagicMock()
    response.json.side_effect = ValueError()
    response.text = ""
    assert (
        extract_error_message(response) == "OpenRouter request failed."
    )
