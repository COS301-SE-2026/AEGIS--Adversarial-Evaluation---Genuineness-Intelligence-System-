import os

os.environ.setdefault("DATABASE_URL", "postgresql://test:test@localhost/test")
os.environ.setdefault("SECRET_KEY", "test-secret-key")
os.environ.setdefault("GOOGLE_CLIENT_ID", "test-client-id")
os.environ.setdefault("GOOGLE_CLIENT_SECRET", "test-client-secret")
os.environ.setdefault("GOOGLE_REDIRECT_URI", "http://localhost:8000/callback")
os.environ.setdefault("GITHUB_CLIENT_ID", "test-github-client-id")
os.environ.setdefault("GITHUB_CLIENT_SECRET", "test-github-client-secret")
os.environ.setdefault("GITHUB_REDIRECT_URI", "http://localhost:8000/github/callback")


import app.main 
from app.models.adversarial_question import AdversarialQuestion
from app.models.question_bank import QuestionBank


def test_source_question_title_returns_title_of_source_question():
    source = QuestionBank(title="Two Sum")
    adversarial = AdversarialQuestion(source_question=source)

    assert adversarial.source_question_title == "Two Sum"


def test_source_question_title_returns_none_without_source_question():
    adversarial = AdversarialQuestion()

    assert adversarial.source_question_title is None