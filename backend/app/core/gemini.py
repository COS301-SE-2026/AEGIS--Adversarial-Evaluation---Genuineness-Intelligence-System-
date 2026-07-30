from google import genai

from app.core.config import settings


def get_gemini_client() -> genai.Client:
    return genai.Client(api_key=settings.gemini_api_key)
