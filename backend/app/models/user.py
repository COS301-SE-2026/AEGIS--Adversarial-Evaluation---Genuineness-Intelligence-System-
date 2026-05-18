from sqlalchemy import (
    BigInteger, Column, Integer, String, TIMESTAMP, ForeignKey, func
)
from sqlalchemy.orm import relationship
from app.models.base import Base


class User(Base):
    __tablename__ = "users"

    user_id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, unique=True, nullable=False)
    full_name = Column(String, nullable=True)
    created_at = Column(TIMESTAMP, server_default=func.now(), nullable=False)
    updated_at = Column(TIMESTAMP, server_default=func.now(),
                        onupdate=func.now(), nullable=False)
    password_hash = Column(String, nullable=True)
    user_role_id = Column(
        BigInteger, ForeignKey("roles.role_id"), nullable=False)

    role = relationship("Role", back_populates="users")
    assessments = relationship("Assessment", back_populates="creator")
    sessions = relationship("CandidateAssessment", back_populates="candidate")
    oauths = relationship("OAuth", back_populates="user")
