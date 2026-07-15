from unittest.mock import MagicMock, patch

from fastapi.testclient import TestClient

from app.database.database import get_db
from app.main import app

client = TestClient(app)


def _db_override():
    mock_db = MagicMock()
    yield mock_db


@patch("app.api.routes.adversarial.get_all_strategies")
def test_list_strategies_returns_data(mock_get_all):
    mock_get_all.return_value = [
        MagicMock(
            strategy_id=1,
            strategy_name="SYMBOL_REDEFINITION",
            description="Redefines a known symbol",
            trap_mechanism_summary="Exploits prior assumptions",
        )
    ]

    app.dependency_overrides[get_db] = _db_override
    response = client.get("/api/v1/adversarial-strategies/")
    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert len(response.json()) == 1


@patch("app.api.routes.adversarial.get_all_strategies")
def test_list_strategies_returns_empty_list(mock_get_all):
    mock_get_all.return_value = []

    app.dependency_overrides[get_db] = _db_override
    response = client.get("/api/v1/adversarial-strategies/")
    app.dependency_overrides.clear()

    assert response.status_code == 200
    assert response.json() == []
