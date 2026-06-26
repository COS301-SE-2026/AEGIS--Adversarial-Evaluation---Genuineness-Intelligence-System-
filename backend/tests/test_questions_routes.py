import os
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

#we are mockinh for now so these are purely here to satisfy our startup validation
os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("SECRET_KEY", "test-secret-key")

from app.main import app
from app.database.database import get_db
from app.core.security import get_current_user


@pytest.fixture
def mock_db():
    return MagicMock()

#all the question management routes require role to be Recruiter
@pytest.fixture
def recruiter_client(mock_db):
    app.dependency_overrides[get_db] = lambda: mock_db #work with mock db
    app.dependency_overrides[get_current_user] = lambda: {"role": "RECRUITER"}  #ensures you can bypass authentication
    yield TestClient(app)
    app.dependency_overrides.clear()

def test_add_source_question_returns_201(recruiter_client):
    with patch(
        "app.api.routes.question_management.create_source_question",
        return_value=MagicMock(
            question_bank_id = 1,
            title = "Python Basics",
            content = "What is Python?",
            type = MagicMock(value="TEXT"),
            maximum_score = 10,
            tags = ["python"]
        ),
    ):
        response = recruiter_client.post(
            "/api/v1/questions/source",
            json={
                "title": "Python Basics",
                "content": "What is Python?",
                "type": "TEXT",
                "maximum_score": 10,
                "correct_answer": None,
                "question_metadata": {},
                "tags": ["python"],
                "category_id": 1,
                "difficulty": "Easy",
            },
        )
    assert response.status_code == 201
    assert response.json()["title"] == "Python Basics"
    assert response.json()["type"] == "TEXT"

    def test_get_all_questions_returns_200(recruiter_client):
        mock_question = MagicMock()
        mock_question.question_bank_id = 1
        mock_question.title = "Python Basics"
        mock_question.content = "What is Python?"
        mock_question.type.value = "TEXT"
        mock_question.maximum_score = 10
        mock_question.tags = ["python"]

        with patch(
            "app.api.routes.question_management.get_all_questions",
            return_value=[mock_question],
        ) as mock_get_all:
            response = recruiter_client.get("/api/v1/questions/")

        assert response.status_code == 200
        body = response.json()
        assert len(body) == 1
        assert body[0]["title"] == "Python Basics"
        assert body[0]["type"] == "TEXT"
        mock_get_all.assert_called_once()