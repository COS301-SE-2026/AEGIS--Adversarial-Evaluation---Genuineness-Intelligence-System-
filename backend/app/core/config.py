from pathlib import Path
from pydantic_settings import BaseSettings, SettingsConfigDict

# Resolve backend/.env regardless of where the process is launched from
_ENV_FILE = Path(__file__).parent.parent.parent / ".env"


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    # PostgreSQL connection string
    database_url: str

    # Secret used to sign JWTs
    secret_key: str

    # JWT signing algorithm
    algorithm: str = "HS256"

    # How long issued JWTs remain valid in minutes
    access_token_expire_minutes: int = 30

    # FastAPI debug mode
    debug: bool = False

    # Comma separated string of allowed CORS origins
    allowed_origins: str = "http://localhost:3000,http://localhost:8000"

    # Google OAuth credentials
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str
    frontend_url: str = "http://localhost:3000"

    # Gemini API configuration
    gemini_api_key: str | None = None
    gemini_model: str = "gemini-1.5-flash"

    # Piston sandbox configuration
    piston_base_url: str = "http://localhost:2000"
    piston_request_timeout_seconds: int = 30


# Single shared instance imported by the rest of the app
settings = Settings()
