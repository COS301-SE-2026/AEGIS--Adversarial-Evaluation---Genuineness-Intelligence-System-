from sqlalchemy.orm import Session
from app.models.question_category import QuestionCategory

def get_all_categories(db: Session) -> list:
    return db.query(QuestionCategory).all()