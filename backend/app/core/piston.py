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
        self.runtime_cache: list[dict[str, Any]] | None = None

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
                self.extract_error_message(exc.response)
                ) from exc
        except httpx.RequestError as exc:
            raise PistonError("Unable to reach the Piston sandbox.") from exc

    @staticmethod
    def extract_error_message(response: httpx.Response) -> str:
        try:
            payload = response.json()
        except ValueError:
            payload = None
        if isinstance(payload, dict):
            return str(
                payload.get("message") or payload.get("error")
                or payload.get("detail")
                or response.text
            )
        return response.text or "Piston request failed."

    def list_runtimes(self) -> list[dict[str, Any]]:
        if self.runtime_cache is None:
            runtimes = self.request("GET", "/api/v2/runtimes")
            self.runtime_cache = runtimes if isinstance(runtimes, list) else []
        return self.runtime_cache

    def resolve_runtime(
        self,
        language: str,
        version: str | None = None,
    ) -> tuple[str, str, str]:
        normalized = language.strip().lower()
        for runtime in self.list_runtimes():
            lang = str(runtime.get("language", "")).lower()
            aliases = {
                str(a).lower()
                for a in runtime.get("aliases", []) or []}
            if normalized in {lang, *aliases}:
                target_version = version or runtime.get("version")
                if target_version:
                    ext = normalized if len(normalized) <= 3 else lang[:3]
                    file_name = f"main.{ext}"
                    return lang, file_name, str(target_version)

        raise PistonError(
            f"No Piston runtime found for language '{normalized}'."
            )

    def execute(
        self,
        language: str,
        source_code: str,
        stdin: str = "",
        version: str | None = None
    ) -> dict[str, Any]:
        normalized_language = language.strip().lower()
        if normalized_language not in {"python", "python3", "py"}:
            raise PistonError(
                "Only Python execution is supported for now."
            )

        runtime_language, file_name, runtime_version = self.resolve_runtime(
            "python",
            version,
        )
        payload = {
            "language": runtime_language,
            "version": runtime_version,
            "files": [{"name": file_name, "content": source_code}],
            "stdin": stdin,
        }
        return self.request("POST", "/api/v2/execute", json=payload)
