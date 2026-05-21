from sqlalchemy import BigInteger, Column, String
from sqlalchemy.orm import relationship
from app.models.base import Base


class Role(Base):
    __tablename__ = "roles"

    role_id = Column(BigInteger, primary_key=True, autoincrement=True)
    role_name = Column(String, unique=True, nullable=False)

    users = relationship("User", back_populates="role")
