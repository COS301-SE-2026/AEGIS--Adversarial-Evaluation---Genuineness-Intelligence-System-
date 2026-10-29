from sqlalchemy import Column, DateTime, Index, Integer, String

from app.models.base import Base


class RevokedToken(Base):
    __tablename__ = "revoked_tokens"
    __table_args__ = (
        Index("ix_revoked_tokens_token_hash", "token_hash", unique=True),
    )

    id = Column(Integer, primary_key=True, autoincrement=True)
    token_hash = Column(String(64), nullable=False)
    expires_at = Column(DateTime(timezone=True), nullable=False)
