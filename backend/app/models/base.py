# SQLAlchemy Base class for all ORM models
# All database models should inherit from this Base class

from sqlalchemy.orm import declarative_base

Base = declarative_base()
