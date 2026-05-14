"""Authentication and security helpers."""

from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password: str, hashed_password: str) -> bool:
	return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
	return pwd_context.hash(password)


def _create_token(subject: str, expires_delta: timedelta, token_type: str) -> str:
	expire = datetime.now(timezone.utc) + expires_delta
	payload: dict[str, Any] = {"sub": subject, "exp": expire, "type": token_type}
	return jwt.encode(payload, settings.SECRET_KEY, algorithm=settings.ALGORITHM)


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
	if expires_delta is None:
		expires_delta = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
	return _create_token(subject=subject, expires_delta=expires_delta, token_type="access")


def create_refresh_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
	if expires_delta is None:
		expires_delta = timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
	return _create_token(subject=subject, expires_delta=expires_delta, token_type="refresh")


def decode_token(token: str) -> dict[str, Any]:
	return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])


def is_token_expired(token: str) -> bool:
	try:
		payload = decode_token(token)
		exp = payload.get("exp")
		if exp is None:
			return True
		return datetime.now(timezone.utc).timestamp() > float(exp)
	except JWTError:
		return True
