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
from app.api.routes.question_management import build_question_response


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

def test_get_filtered_questions_returns_200(recruiter_client):
    mock_question = MagicMock()
    mock_question.question_bank_id = 1
    mock_question.title = "Python Basics"
    mock_question.content = "What is Python?"
    mock_question.type.value = "TEXT"
    mock_question.maximum_score = 10
    mock_question.tags = ["python"]
    with patch(
        "app.api.routes.question_management.get_filtered_questions",
        return_value=[mock_question],
    ) as mock_get_filtered:
        response = recruiter_client.get(
            "/api/v1/questions/filter?tags=python&difficulty=Easy&category_id=1"
        )
    assert response.status_code == 200
    body = response.json()
    assert len(body) == 1
    assert body[0]["title"] == "Python Basics"
    assert body[0]["type"] == "TEXT"
    mock_get_filtered.assert_called_once()

def test_update_source_question_returns_200(recruiter_client):
    mock_question = MagicMock()
    mock_question.question_bank_id = 1
    mock_question.title = "New title"
    mock_question.content = "New content"
    mock_question.type.value = "TEXT"
    mock_question.maximum_score = 10
    mock_question.tags = ["python"]
    with patch(
        "app.api.routes.question_management.update_question",
        return_value=mock_question,
    ) as mock_update:
        response = recruiter_client.patch(
            "/api/v1/questions/source/1",
            json={
                "title": "New title",
                "content": "New content",
                "type": "TEXT",
                "maximum_score": 10,
                "correct_answer": None,
                "question_metadata": {},
                "tags": ["python"],
                "category_id": 1,
                "difficulty": "Easy",
            },
        )
    assert response.status_code == 200
    body = response.json()
    assert body["title"] == "New title"
    assert body["type"] == "TEXT"
    mock_update.assert_called_once()

def test_returns_403_for_non_recruiter(mock_db):
    app.dependency_overrides[get_db] = lambda: mock_db
    app.dependency_overrides[get_current_user] = lambda: {"role": "CANDIDATE"}
    client = TestClient(app)
    response = client.get("/api/v1/questions/source/1")
    response = client.get("/api/v1/questions/source")
    response = client.get("/api/v1/questions/filter?tags=python")
    response = client.get("/api/v1/questions/")
    app.dependency_overrides.clear()
    assert response.status_code == 403
    assert "Only recruiters" in response.json()["detail"]

def test_returns_400_when_no_filters(recruiter_client):
    response = recruiter_client.get("/api/v1/questions/filter")
    assert response.status_code == 400
    assert "At least one filter" in response.json()["detail"]


def test_build_question_response_invalid_fields():
    question = MagicMock()
    question.question_bank_id = 99
    question.title = "Test question mfana"
    question.content = "Fallback content mxm"
    question.type = MagicMock(value=123)
    question.maximum_score = "letter lets see"
    question.tags = "python"
    question.category_id = 7
    question.difficulty = "Hard"
    response = build_question_response(question)
    assert response["question_bank_id"] == 99
    assert response["type"] == "TEXT"
    assert response["maximum_score"] == 0
    assert response["tags"] == []
    assert response["category_id"] == 7
    assert response["difficulty"] == "Hard"