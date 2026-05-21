from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings


# Create the SQLAlchemy engine using the database URL from settings
engine = create_engine(settings.database_url)

# Each request gets its own session, closed when the request ends
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
