import urllib.parse

import httpx
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.user import User, UserRole

_GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
_GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
_GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo"


# builds the Google OAuth authorization URL the frontend redirects the user to.
def get_google_auth_url() -> str:
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
    }
    return f"{_GOOGLE_AUTH_URL}?{urllib.parse.urlencode(params)}"


# Exchanges Google's authorization code for an access token, then returns the user's profile dict.
async def exchange_code_for_user_info(code: str) -> dict:
    async with httpx.AsyncClient() as client:
        token_resp = await client.post(
            _GOOGLE_TOKEN_URL,
            data={
                "code": code,
                "client_id": settings.google_client_id,
                "client_secret": settings.google_client_secret,
                "redirect_uri": settings.google_redirect_uri,
                "grant_type": "authorization_code",
            },
        )
        if token_resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to exchange authorization code with Google",
            )
        token_data = token_resp.json()
        access_token = token_data.get("access_token")
        if not access_token:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Google token response did not include an access token",
            )

        userinfo_resp = await client.get(
            _GOOGLE_USERINFO_URL,
            headers={"Authorization": f"Bearer {access_token}"},
        )
        if userinfo_resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to retrieve user info from Google",
            )
        return userinfo_resp.json()


# Looks up the user in the DB by google_id then email, creating a new record if needed.
# AVATAR URL NEEDS TO BE ADDED L8R
async def get_or_create_user(db: Session, user_info: dict) -> User:
    google_id = user_info.get("id")
    email = user_info.get("email")

    user = db.query(User).filter(User.google_id == google_id).first()

    if user is None:
        user = db.query(User).filter(User.email == email).first()
        if user is not None:
            user.google_id = google_id
            user.avatar_url = user_info.get("picture")

    if user is None:
        user = User(
            email=email,
            full_name=user_info.get("name"),
            google_id=google_id,
            #avatar_url=user_info.get("picture"),
            role=UserRole.CANDIDATE,
        )
        db.add(user)

    db.commit()
    db.refresh(user)
    return user
