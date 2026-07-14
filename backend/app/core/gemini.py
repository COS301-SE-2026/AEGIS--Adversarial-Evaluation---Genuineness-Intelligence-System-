import google.generativeai as genai

from app.core.config import settings

_MODEL_NAME = "gemini-2.5-flash"


def get_gemini_model(
    system_instruction: str | None = None,
) -> genai.GenerativeModel:
    genai.configure(api_key=settings.gemini_api_key)
    return genai.GenerativeModel(
        _MODEL_NAME,
        system_instruction=system_instruction,
    )
