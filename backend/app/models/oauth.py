from sqlalchemy import BigInteger, Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base


class OAuth(Base):
    __tablename__ = "oauths"

    oauth_id = Column(BigInteger, primary_key=True, autoincrement=True)
    oauth_provider = Column(String, nullable=False)
    provider_user_id = Column(String, unique=True, nullable=True)
    access_token = Column(String, nullable=True)
    oauth_user_id = Column(
        Integer, ForeignKey("users.user_id"), nullable=False)

    user = relationship("User", back_populates="oauths")
