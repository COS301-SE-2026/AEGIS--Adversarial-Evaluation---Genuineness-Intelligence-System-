import importlib
import json
import os
from unittest.mock import MagicMock, patch
import pytest
from botocore.exceptions import ClientError

import app.core.config as config_module
from app.core.config import load_aws_secrets

def test_load_aws_secrets_success():
    mock_payload = {"TEST_CONFIG_KEY": "sho_mhlaba"}
    with patch("boto3.client") as mock_boto:
        mock_client = MagicMock()
        mock_client.get_secret_value.return_value = {
            "SecretString": json.dumps(mock_payload)
        }
        mock_boto.return_value = mock_client

        load_aws_secrets()

        assert os.environ.get("TEST_CONFIG_KEY") == "sho_mhlaba"


def test_load_aws_secrets_client_error():
    with patch("boto3.client") as mock_boto:
        mock_client = MagicMock()
        error_response = {
            "Error": {
                "Code": "ResourceNotFoundException",
                "Message": "Secret not found",
            }
        }
        mock_client.get_secret_value.side_effect = ClientError(
            error_response, "GetSecretValue"
        )
        mock_boto.return_value = mock_client

        with pytest.raises(RuntimeError, match="Unable to retrieve AWS secret"):
            load_aws_secrets()


def test_load_aws_secrets_missing_secret_string():
    with patch("boto3.client") as mock_boto:
        mock_client = MagicMock()
        mock_client.get_secret_value.return_value = {}
        mock_boto.return_value = mock_client

        with pytest.raises(RuntimeError, match="does not contain a SecretString"):
            load_aws_secrets()


def test_load_aws_secrets_invalid_json():
    with patch("boto3.client") as mock_boto:
        mock_client = MagicMock()
        mock_client.get_secret_value.return_value = {"SecretString": "{invalid_json}"}
        mock_boto.return_value = mock_client

        with pytest.raises(RuntimeError, match="does not contain valid JSON"):
            load_aws_secrets()


def test_load_aws_secrets_non_dict_json():
    with patch("boto3.client") as mock_boto:
        mock_client = MagicMock()
        mock_client.get_secret_value.return_value = {"SecretString": '["value1"]'}
        mock_boto.return_value = mock_client

        with pytest.raises(RuntimeError, match="must contain a JSON object"):
            load_aws_secrets()


def _reload_config():
    with patch("boto3.client") as mock_boto:
        mock_boto.return_value.get_secret_value.return_value = {
            "SecretString": "{}"
        }
        importlib.reload(config_module)
    return mock_boto


def test_settings_model_config_declares_env_file():
    assert config_module.Settings.model_config["env_file"] == ".env"
    assert config_module.Settings.model_config["env_file_encoding"] == "utf-8"


def test_settings_reads_from_env_file_when_env_var_is_absent(
    tmp_path, monkeypatch,
):
    env_file = tmp_path / ".env"
    env_file.write_text("PISTON_ENABLED=true\n")
    monkeypatch.delenv("PISTON_ENABLED", raising=False)

    result = config_module.Settings(_env_file=str(env_file))

    assert result.piston_enabled is True


def test_settings_env_var_overrides_env_file_value(tmp_path, monkeypatch):
    env_file = tmp_path / ".env"
    env_file.write_text("PISTON_ENABLED=true\n")
    monkeypatch.setenv("PISTON_ENABLED", "false")

    result = config_module.Settings(_env_file=str(env_file))

    assert result.piston_enabled is False


def test_load_aws_secrets_not_called_when_environment_not_production():
    original = os.environ.pop("ENVIRONMENT", None)
    try:
        mock_boto = _reload_config()
        mock_boto.assert_not_called()
    finally:
        if original is not None:
            os.environ["ENVIRONMENT"] = original
        _reload_config()


def test_load_aws_secrets_called_when_environment_is_production():
    original = os.environ.get("ENVIRONMENT")
    os.environ["ENVIRONMENT"] = "production"
    try:
        mock_boto = _reload_config()
        mock_boto.assert_called_once()
    finally:
        if original is None:
            os.environ.pop("ENVIRONMENT", None)
        else:
            os.environ["ENVIRONMENT"] = original
        _reload_config()

