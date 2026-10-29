import hashlib
from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.database import get_db
from app.models.revoked_token import RevokedToken

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/google/callback")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(
    data: dict, expires_delta: timedelta | None = None
) -> str:
    to_encode = data.copy()  # need to copy data dict cuz apparently
    # we modify it by changing
    if expires_delta is not None:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.access_token_expire_minutes
        )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.secret_key,
                      algorithm=settings.algorithm)


def verify_access_token(token: str) -> dict:
    try:
        payload = jwt.decode(
            token, settings.secret_key, algorithms=[settings.algorithm]
        )
        return payload
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token is invalid or has expired",
            headers={"WWW-Authenticate": "Bearer"},
        )


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def is_token_revoked(db: Session, token: str) -> bool:
    return (
        db.query(RevokedToken)
        .filter(RevokedToken.token_hash == hash_token(token))
        .first()
        is not None
    )


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
) -> dict:
    payload = verify_access_token(token)
    if is_token_revoked(db, token):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has been revoked",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return payload


def get_logout_user(token: str = Depends(oauth2_scheme)) -> dict:
    return verify_access_token(token)


def hash_password(plain: str) -> str:
    return pwd_context.hash(plain)


def verify_password(plain: str, hashed: str) -> bool:
    return pwd_context.verify(plain, hashed)
