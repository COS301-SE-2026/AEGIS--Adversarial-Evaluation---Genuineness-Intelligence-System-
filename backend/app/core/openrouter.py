from __future__ import annotations

import concurrent.futures

import httpx

from app.core.config import settings

_OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
_REQUEST_TIMEOUT_SECONDS = 30

_MAX_TOKENS = 1024

_JSON_ONLY_INSTRUCTION = (
    "\n\nRespond with JSON only, matching the exact schema requested "
    "above. Output ONLY the raw JSON object: no reasoning, no "
    "explanation, no preamble, no chain-of-thought, and no text "
    "before or after the JSON object. Do not wrap it in markdown "
    "code fences. The first character of your response must be `{` "
    "and the last character must be `}`."
)


class OpenRouterError(RuntimeError):
    "We will raise this when the OpenRouter API request cannot be satisfied"


def _post_to_openrouter(payload: dict, headers: dict) -> dict:
    with httpx.Client(timeout=_REQUEST_TIMEOUT_SECONDS) as client:
        response = client.post(
            _OPENROUTER_URL, json=payload, headers=headers
        )
        response.raise_for_status()
        return response.json()


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
        "max_tokens": _MAX_TOKENS,
        "messages": [
            {
                "role": "system",
                "content": system_instruction + _JSON_ONLY_INSTRUCTION,
            },
            {"role": "user", "content": contents},
        ],
    }
    headers = {"Authorization": f"Bearer {settings.openrouter_api_key}"}

    executor = concurrent.futures.ThreadPoolExecutor(max_workers=1)
    try:
        future = executor.submit(_post_to_openrouter, payload, headers)
        try:
            data = future.result(timeout=_REQUEST_TIMEOUT_SECONDS)
        except concurrent.futures.TimeoutError as exc:
            raise OpenRouterError(
                "OpenRouter request timed out after "
                f"{_REQUEST_TIMEOUT_SECONDS}s"
            ) from exc
        except httpx.HTTPStatusError as exc:
            raise OpenRouterError(
                extract_error_message(exc.response)
            ) from exc
        except httpx.RequestError as exc:
            raise OpenRouterError("Unable to reach OpenRouter.") from exc
    finally:
        executor.shutdown(wait=False, cancel_futures=True)

    error_body = data.get("error")
    if error_body:
        raise OpenRouterError(_extract_error_from_body(error_body))

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


def _extract_error_from_body(error_body: object) -> str:
    if not isinstance(error_body, dict):
        return str(error_body)
    message = (
        error_body.get("message") or error_body.get("detail")
        or str(error_body)
    )
    code = error_body.get("code")
    return f"{message} (code {code})" if code is not None else str(message)


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
