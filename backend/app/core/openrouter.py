from __future__ import annotations

import httpx

from app.core.config import settings

_OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
_REQUEST_TIMEOUT_SECONDS = 30

_JSON_ONLY_INSTRUCTION = (
    "\n\nRespond with JSON only, matching the exact schema requested "
    "above. Do not include any text before or after the JSON object, "
    "and do not wrap it in markdown code fences."
)


class OpenRouterError(RuntimeError):
    "We will raise this when the OpenRouter API request cannot be satisfied"


def call_openrouter(
    system_instruction: str, contents: str, models: list[str]
) -> tuple[str, str]:
    if not settings.openrouter_api_key:
        raise OpenRouterError(
            "OPENROUTER_API_KEY is not configured; cannot use the "
            "OpenRouter fallback."
        )

    payload = {
        "models": models,
        "messages": [
            {
                "role": "system",
                "content": system_instruction + _JSON_ONLY_INSTRUCTION,
            },
            {"role": "user", "content": contents},
        ],
    }
    headers = {"Authorization": f"Bearer {settings.openrouter_api_key}"}

    try:
        with httpx.Client(timeout=_REQUEST_TIMEOUT_SECONDS) as client:
            response = client.post(
                _OPENROUTER_URL, json=payload, headers=headers
            )
            response.raise_for_status()
            data = response.json()
    except httpx.HTTPStatusError as exc:
        raise OpenRouterError(
            extract_error_message(exc.response)
        ) from exc
    except httpx.RequestError as exc:
        raise OpenRouterError("Unable to reach OpenRouter.") from exc

    try:
        content = data["choices"][0]["message"]["content"]
    except (KeyError, IndexError, TypeError) as exc:
        raise OpenRouterError(
            "OpenRouter response missing expected content"
        ) from exc

    served_by = data.get("model")
    if not served_by:
        raise OpenRouterError(
            "OpenRouter response missing 'model' field; cannot "
            "determine which model served this request"
        )
    return content, served_by


def extract_error_message(response: httpx.Response) -> str:
    try:
        payload = response.json()
    except ValueError:
        payload = None
    if isinstance(payload, dict):
        return str(
            payload.get("message") or payload.get("error")
            or payload.get("detail") or response.text
        )
    return response.text or "OpenRouter request failed."
