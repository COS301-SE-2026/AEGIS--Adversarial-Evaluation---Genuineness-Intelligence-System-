import json
import os
from unittest.mock import MagicMock, patch
import pytest

from app.core.config import Settings, load_aws_secrets


def test_aws_secrets_to_pydantic_settings_integration():
    "Verify that JSON secrets loaded from AWS Secrets Manager. Populate a new Pydantic Settings instance afterwards."

    mock_aws_payload = {
        "DATABASE_URL": "postgresql://postgres.youreallythoughtsohuh:123YoureCrazy@aws-1-eu-west-3.pooeler.supabase.com:43210/postgres",
        "SECRET_KEY": "the-secret-key-is-your-home-address",
        "GOOGLE_CLIENT_ID": "0123456789-UProcks.apps.googleusercontent.com",
        "GOOGLE_CLIENT_SECRET": "GOas-kGOOG-LEforTHEkey",
        "GOOGLE_REDIRECT_URI": "http://college.dropout.co.za/auth/google/callback",
    }

    with patch("boto3.client") as mock_boto:
        mock_client = MagicMock()
        mock_client.get_secret_value.return_value = {
            "SecretString": json.dumps(mock_aws_payload)
        }
        mock_boto.return_value = mock_client

        load_aws_secrets()

        test_settings = Settings()

        assert os.environ["DATABASE_URL"] == "postgresql://postgres.youreallythoughtsohuh:123YoureCrazy@aws-1-eu-west-3.pooeler.supabase.com:43210/postgres"
        assert os.environ["SECRET_KEY"] == "the-secret-key-is-your-home-address"


        assert test_settings.database_url == "postgresql://postgres.youreallythoughtsohuh:123YoureCrazy@aws-1-eu-west-3.pooeler.supabase.com:43210/postgres"
        assert test_settings.secret_key == "the-secret-key-is-your-home-address"
        assert test_settings.google_client_id == "0123456789-UProcks.apps.googleusercontent.com"
        assert test_settings.google_client_secret == "GOas-kGOOG-LEforTHEkey"
        assert test_settings.google_redirect_uri == "http://college.dropout.co.za/auth/google/callback"



def test_db_engine_creation_with_loaded_config(test_engine):
    "verify integration between loaded database config and SQLAlchemy engine config"
    assert test_engine is not None
        