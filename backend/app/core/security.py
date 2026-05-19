from datetime import datetime, timedelta, timezone
# timedelta is to express durations like 30 minutes from now, 
# timezone.utc ensures we use UTC times for token expiry, avoiding timezone issues with them JWT tokens

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from jose import JWTError, jwt

from app.core.config import settings

# the Oauth2PasswordBearer is a utility that just extract a Bearer token from the request header
# Ideally frontend will send a header like 'Authorization: Bearer eyJ...'
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/google/callback")



def create_access_token(
    data: dict, expires_delta: timedelta | None = None
) -> str:
    to_encode = data.copy() # need to copy data dict cuz apparently we modify it by changing
    if expires_delta is not None:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(
            minutes=settings.access_token_expire_minutes
        )
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.secret_key, algorithm=settings.algorithm)



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



def get_current_user(token: str = Depends(oauth2_scheme)) -> dict:
    return verify_access_token(token)
