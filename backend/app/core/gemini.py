from google import genai
from google.genai import types

from app.core.config import settings

_JSON_MIME_TYPE = "application/json"


def get_gemini_client() -> genai.Client:
    return genai.Client(api_key=settings.gemini_api_key)


def call_gemini(system_instruction: str, contents: str, model: str) -> str:
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
