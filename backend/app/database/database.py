from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings


# Create the SQLAlchemy engine using the database URL from settings
# Sync routes run in FastAPI's threadpool, so size the pool for concurrent
# requests and fail fast rather than queueing behind slow ones.
engine = create_engine(
    settings.database_url,
    pool_size=10,
    max_overflow=20,
    pool_timeout=10,
    pool_pre_ping=True,
)

# Each request gets its own session, closed when the request ends
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
