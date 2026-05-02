import enum

from sqlalchemy import Column, Integer, String, Enum, TIMESTAMP, func
from sqlalchemy.orm import relationship
from app.models.base import Base

class UserRole(enum.Enum):
    RECRUITER = "RECRUITER"
    CANDIDATE = "CANDIDATE"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    auth_provider = Column(String, nullable=True)
    google_id = Column(String, unique=True, nullable=True)
    github_id = Column(String, unique=True, nullable=True)
    email = Column(String, unique=True, nullable=False)
    full_name = Column(String, nullable=True)
    role = Column(Enum(UserRole), nullable=False)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(), onupdate=func.now(), nullable=False)

    assessments = relationship("Assessment", back_populates="creator")
    sessions = relationship("CandidateAssessment", back_populates="candidate")
