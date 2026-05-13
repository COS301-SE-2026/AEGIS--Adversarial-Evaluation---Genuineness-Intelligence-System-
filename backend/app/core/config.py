from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

#path resolution for .env file
_ENV_FILE = Path(__file__).parent.parent.parent / ".env"

#BaseSettings is a class in Pydantic that knows how to read from the .env file automatically
class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=str(_ENV_FILE),
        env_file_encoding="utf-8",
        case_sensitive=False,
    )

    
    database_url: str
    secret_key: str
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    debug: bool = False
    allowed_origins: list[str] = []
    google_client_id: str
    google_client_secret: str
    google_redirect_uri: str


# validator, runs before pydantic tries to validate the allowed_origins
    @field_validator("allowed_origins", mode="before")
    @classmethod
    def parse_allowed_origins(cls, v: str | list) -> list:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

# singleton to create instance of Settings class when the files imported
settings = Settings()
