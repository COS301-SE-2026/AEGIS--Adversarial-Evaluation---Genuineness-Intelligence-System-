import logging

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


class LLMProviderError(RuntimeError):
    "Raised when both Gemini and the OpenRouter fallback fail to respond."


def get_gemini_client() -> genai.Client:
    return genai.Client(
        api_key=settings.gemini_api_key,
        http_options=types.HttpOptions(
            timeout=settings.gemini_timeout_seconds * 1000
        ),
    )


def _call_gemini(system_instruction: str, contents: str, model: str) -> str:
    client = get_gemini_client()
    response = client.models.generate_content(
        model=model,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=system_instruction,
            temperature=0.0,
            response_mime_type=_JSON_MIME_TYPE,
        ),
    )
    return response.text


def call_llm(
    system_instruction: str,
    contents: str,
    model: str,
    allow_fallback: bool = True,
) -> tuple[str, str]:
    try:
        return _call_gemini(system_instruction, contents, model), model
    except _GEMINI_FALLBACK_ERRORS as exc:
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
        try:
            return call_openrouter(
                system_instruction, contents, settings.openrouter_models
            )
        except OpenRouterError as fallback_exc:
            raise LLMProviderError(
                "Both providers failed to respond: "
                f"gemini={exc}; openrouter={fallback_exc}"
            ) from fallback_exc
