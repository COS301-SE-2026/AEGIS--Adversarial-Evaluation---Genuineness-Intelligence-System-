import json
import os
from unittest.mock import MagicMock, patch
import pytest
from botocore.exceptions import ClientError

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

