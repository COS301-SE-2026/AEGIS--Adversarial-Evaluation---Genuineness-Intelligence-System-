import logging
import threading
import time

import httpx
import requests
from google import genai
from google.genai import errors as genai_errors
from google.genai import types

from app.core.config import settings
from app.core.openrouter import OpenRouterError, call_openrouter

_JSON_MIME_TYPE = "application/json"

_logger = logging.getLogger(__name__)

_GEMINI_FALLBACK_ERRORS = (
    genai_errors.APIError,
    requests.RequestException,
    httpx.RequestError,
    TimeoutError,
    OSError,
)


_BREAKER_CLOSED = "closed"
_BREAKER_OPEN = "open"
_BREAKER_HALF_OPEN = "half_open"

_GATE_CALL = "call"
_GATE_PROBE = "probe"
_GATE_SKIP = "skip"


class LLMProviderError(RuntimeError):
    "Raised when both Gemini and the OpenRouter fallback fail to respond."


def _monotonic() -> float:
    return time.monotonic()


def _classify_gemini_failure(exc: Exception) -> str | None:
    if isinstance(exc, genai_errors.APIError):
        if exc.code == 429:
            return "quota"
        if 500 <= exc.code < 600:
            return "server_error"
        if exc.code in (401, 403):
            return "auth"
        return None
    if isinstance(
        exc,
        (requests.Timeout, httpx.TimeoutException, TimeoutError),
    ):
        return "timeout"
    if isinstance(
        exc,
        (requests.RequestException, httpx.RequestError, OSError),
    ):
        return "connection"
    return None


class _GeminiBreaker:
    def __init__(self) -> None:
        self._lock = threading.Lock()
        self.reset()

    def reset(self) -> None:
        with self._lock:
            self._state = _BREAKER_CLOSED
            self._failures = 0
            self._opened_at = 0.0
            self._probe_in_flight = False

    @property
    def state(self) -> str:
        with self._lock:
            return self._state

    def acquire(self) -> str:
        with self._lock:
            if self._state == _BREAKER_CLOSED:
                return _GATE_CALL
            if self._state == _BREAKER_OPEN:
                elapsed = _monotonic() - self._opened_at
                if elapsed < settings.gemini_breaker_cooldown_seconds:
                    return _GATE_SKIP
                self._state = _BREAKER_HALF_OPEN
                _logger.warning(
                    "Gemini breaker open -> half_open: cooldown elapsed"
                )
            if self._probe_in_flight:
                return _GATE_SKIP
            self._probe_in_flight = True
            return _GATE_PROBE

    def record_success(self, probe: bool) -> None:
        with self._lock:
            if probe:
                self._probe_in_flight = False
                self._close("probe succeeded")
            elif self._state == _BREAKER_CLOSED:
                self._failures = 0

    def record_failure(self, category: str | None, probe: bool) -> None:
        with self._lock:
            if probe:
                self._probe_in_flight = False
                if category is None:
                    self._close("probe reached Gemini")
                else:
                    self._open(f"probe failed: {category}")
                return
            if category is None or self._state != _BREAKER_CLOSED:
                return
            self._failures += 1
            threshold = settings.gemini_breaker_failure_threshold
            if self._failures >= threshold:
                self._open(
                    f"{self._failures} consecutive failures: {category}"
                )

    def release_probe(self) -> None:
        with self._lock:
            self._probe_in_flight = False

    def _open(self, reason: str) -> None:
        previous = self._state
        self._state = _BREAKER_OPEN
        self._opened_at = _monotonic()
        _logger.warning("Gemini breaker %s -> open: %s", previous, reason)

    def _close(self, reason: str) -> None:
        previous = self._state
        self._failures = 0
        if previous != _BREAKER_CLOSED:
            self._state = _BREAKER_CLOSED
            _logger.warning(
                "Gemini breaker %s -> closed: %s", previous, reason
            )


_breaker = _GeminiBreaker()


def reset_gemini_breaker() -> None:
    _breaker.reset()


def get_gemini_client() -> genai.Client:
    return genai.Client(
        api_key=settings.gemini_api_key,
        http_options=types.HttpOptions(
            timeout=settings.gemini_timeout_seconds * 1000
        ),
    )


def _call_gemini(
    system_instruction: str,
    contents: str,
    model: str,
    json_mode: bool = True,
) -> str:
    client = get_gemini_client()
    response = client.models.generate_content(
        model=model,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.0,
            response_mime_type=_JSON_MIME_TYPE if json_mode else None,
        ),
    )
    return response.text


def _call_openrouter_only(
    system_instruction: str,
    contents: str,
    json_mode: bool,
    gemini_note: str,
) -> tuple[str, str]:
    try:
        return call_openrouter(
            system_instruction,
            contents,
            settings.openrouter_model,
            json_mode,
        )
    except OpenRouterError as fallback_exc:
        raise LLMProviderError(
            "Both providers failed to respond: "
            f"gemini={gemini_note}; openrouter={fallback_exc}"
        ) from fallback_exc


def call_llm(
    system_instruction: str,
    contents: str,
    model: str,
    allow_fallback: bool = True,
    json_mode: bool = True,
) -> tuple[str, str]:
    if settings.force_backup_ai:
        _logger.info("FORCE_BACKUP_AI is set; routing call to OpenRouter")
        return _call_openrouter_only(
            system_instruction, contents, json_mode, "skipped (forced)"
        )

    gate = _breaker.acquire() if allow_fallback else _GATE_CALL
    if gate == _GATE_SKIP:
        return _call_openrouter_only(
            system_instruction, contents, json_mode, "skipped (breaker)"
        )

    probe = gate == _GATE_PROBE
    try:
        text = _call_gemini(system_instruction, contents, model, json_mode)
    except _GEMINI_FALLBACK_ERRORS as exc:
        _breaker.record_failure(_classify_gemini_failure(exc), probe)
        if not allow_fallback:
            _logger.warning(
                "Gemini call failed (%s: %s); OpenRouter fallback "
                "disabled for this call",
                type(exc).__name__,
                exc,
            )
            raise LLMProviderError(f"gemini={exc}") from exc
        _logger.warning(
            "Gemini call failed (%s: %s), falling back to OpenRouter",
            type(exc).__name__,
            exc,
        )
        return _call_openrouter_only(
            system_instruction, contents, json_mode, str(exc)
        )
    except BaseException:
        if probe:
            _breaker.release_probe()
        raise
    _breaker.record_success(probe)
    return text, model
