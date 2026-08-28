import json
import os
import boto3

from botocore.exceptions import ClientError
from pydantic_settings import BaseSettings, SettingsConfigDict

AWS_REGION = os.getenv("AWS_REGION","af-south-1")

AWS_SECRET_NAME = os.getenv("AWS_SECRET_NAME", "prod/aegis/backend",)

def load_aws_secrets() -> None: 
    # this wll load secrets straight from the AWS Secrets Manager.

    client = boto3.client(
        "secretsmanager",
        region_name=AWS_REGION,
    )

    try:
        response = client.get_secret_value( 
            SecretId=AWS_SECRET_NAME 
        )
    except ClientError as exc:
        error_code = exc.response.get(
            "Error",
            {}
        ).get(
            "Code",
            "Unknown",
        )
        raise RuntimeError(
            f"Unable to retrieve AWS secret "
            f"{AWS_SECRET_NAME}. "
            f"AWS error: {error_code}"
        ) from exc

    secret_string = response.get("SecretString")

    if not secret_string:
        raise RuntimeError(
            f"AWS secret {AWS_SECRET_NAME} does not contain a SecretString."
        )

    try: 
        secrets = json.loads(secret_string)

    except json.JSONDecodeError as exc: 
        raise RuntimeError(
            f"AWS secret {AWS_SECRET_NAME} does not contain valid JSON."
        ) from exc

    if not isinstance(secrets, dict):
        raise RuntimeError(
            f"AWS secret {AWS_SECRET_NAME} must contain a JSON object"
        )

    # make the fetched values Pydantic ready as environment variables.
    for key, value in secrets.items(): 
        os.environ[key] = str(value);

load_aws_secrets()

class Settings(BaseSettings):
    
    model_config = SettingsConfigDict(
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
    access_token_expire_minutes: int = 60

    # FastAPI debug mode
    debug: bool = False

    # Comma separated string of allowed CORS origins
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:8000"
    ]

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
    piston_enabled: bool = False


# Single shared instance imported by the rest of the app
settings = Settings()
