import os
from unittest.mock import MagicMock, patch
import httpx
import pytest
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-client-id")
os.environ.setdefault("GOOGLE_CLIENT_SECRET", "test-client-secret")
os.environ.setdefault("GOOGLE_REDIRECT_URI", "http://localhost:8000/callback")
from app.core.piston import PistonClient, PistonError

def test_request_returns_json_on_success():
    client = PistonClient(base_url="http://piston.test", timeout_seconds=5)
    response = MagicMock()
    response.raise_for_status.return_value = None
    response.json.return_value = {"ok": True}
    http_request = MagicMock(return_value=response)
    with patch("app.core.piston.httpx.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.request = http_request
        mock_client_cls.return_value.__enter__.return_value = mock_client
        result = client.request("GET", "/runtimes")
    assert result == {"ok": True}
    http_request.assert_called_once_with(
        method="GET",
        url="http://piston.test/runtimes",
        json=None,
    )

def test_list_runtimes_caches_response():
    client = PistonClient(base_url="http://piston.test", timeout_seconds=5)
    with patch.object(client, "request", return_value=[{"language": "python"}]) as mock_request:
        first = client.list_runtimes()
        second = client.list_runtimes()
    assert first == [{"language": "python"}]
    assert second == [{"language": "python"}]
    assert mock_request.call_count == 1

def test_piston_http_status_error():
    client = PistonClient(base_url="http://piston.test", timeout_seconds=5)
    request = httpx.Request("GET", "http://piston.test/runtimes")
    response = httpx.Response(
        400,
        request=request,
        content=b'{"detail":"boom"}',
    )
    with patch("app.core.piston.httpx.Client") as mock_client_cls:
        mock_client = MagicMock()
        mock_client.request.return_value = response
        mock_client_cls.return_value.__enter__.return_value = mock_client
        with pytest.raises(PistonError) as exc_info:
            client.request("GET", "/runtimes")
    assert str(exc_info.value) == "boom"

def test_extract_error_message_uses_json_message():
    request = httpx.Request("GET", "http://piston.test/runtimes")
    response = httpx.Response(
        400,
        request=request,
        content=b'{"message":"bad request"}',
    )
    assert PistonClient.extract_error_message(response) == "bad request"

def test_resolve_runtime_returns_language_and_filename():
    client = PistonClient(base_url="http://piston.test", timeout_seconds=5)
    with patch.object(
        client,
        "list_runtimes",
        return_value=[
            {
                "language": "go",
                "version": "1.34",
                "aliases": ["golang"],
            }
        ],
    ):
        language, file_name, version = client.resolve_runtime("go")
    assert language == "go"
    assert file_name == "main.go"
    assert version == "1.34"

def test_resolve_runtime_raises_when_missing():
    client = PistonClient(base_url="http://piston.test", timeout_seconds=5)
    with patch.object(client, "list_runtimes", return_value=[]):
        with pytest.raises(PistonError) as exc_info:
            client.resolve_runtime("rust")
    
    assert "No Piston runtime found" in str(exc_info.value)