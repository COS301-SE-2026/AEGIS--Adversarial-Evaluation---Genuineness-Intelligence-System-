from __future__ import annotations
from typing import Any
import httpx
from app.core.config import settings


class PistonError(RuntimeError):
    "We will raise this when the Piston API request cannot be satisfied"


class PistonClient:
    def __init__(
        self,
        base_url: str | None = None,
        timeout_seconds: int | None = None
    ) -> None:
        self.base_url = (base_url or settings.piston_base_url).rstrip("/")
        self.timeout_seconds = (
            timeout_seconds or settings.piston_request_timeout_seconds)
        self._runtimes_cache: list[dict[str, Any]] | None = None

    def request(
            self,
            method: str,
            path: str,
            json: dict[str, Any] | None = None
    ) -> Any:
        try:
            with httpx.Client(timeout=self.timeout_seconds) as client:
                response = client.request(
                    method=method,
                    url=f"{self.base_url}{path}",
                    json=json
                )
                response.raise_for_status()
                return response.json()
        except httpx.HTTPStatusError as exc:
            raise PistonError(
                self._extract_error_message(exc.response)
                ) from exc
        except httpx.RequestError as exc:
            raise PistonError("Unable to reach the Piston sandbox.") from exc
