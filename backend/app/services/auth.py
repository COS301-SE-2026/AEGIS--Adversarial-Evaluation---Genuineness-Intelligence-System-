from urllib.parse import urlencode

import httpx
from sqlalchemy.orm import Session

from app.core.config import settings
from app.models.oauth import OAuth
from app.models.role import Role
from app.models.user import User


def get_google_auth_url() -> str:
    params = {
        "client_id": settings.google_client_id,
        "redirect_uri": settings.google_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "offline",
    }
    return f"https://accounts.google.com/o/oauth2/v2/auth?{urlencode(params)}"


def exchange_code_for_user_info(code: str) -> dict:
    token_response = httpx.post(
        "https://oauth2.googleapis.com/token",
        data={
            "code": code,
            "client_id": settings.google_client_id,
            "client_secret": settings.google_client_secret,
            "redirect_uri": settings.google_redirect_uri,
            "grant_type": "authorization_code",
        },
    )
    token_response.raise_for_status()
    access_token = token_response.json()["access_token"]

    userinfo_response = httpx.get(
        "https://www.googleapis.com/oauth2/v2/userinfo",
        headers={"Authorization": f"Bearer {access_token}"},
    )
    userinfo_response.raise_for_status()
    user_info = userinfo_response.json()
    user_info["access_token"] = access_token
    return user_info


def get_or_create_user(db: Session, user_info: dict) -> User:
    provider_user_id = user_info.get("id") or user_info.get("sub")
    email = user_info.get("email")
    full_name = user_info.get("name")
    access_token = user_info.get("access_token")

    # 1. Look up existing OAuth record for this Google identity.
    oauth_record = (
        db.query(OAuth)
        .filter(
            OAuth.provider_user_id == provider_user_id,
            OAuth.oauth_provider == "google",
        )
        .first()
    )
    if oauth_record:
        return oauth_record.user

    # 2. No OAuth record — check if a user with this email already exists.
    user = db.query(User).filter(User.email == email).first()

    if user:
        # Link the existing user to this Google identity.
        oauth_record = OAuth(
            oauth_provider="google",
            provider_user_id=provider_user_id,
            access_token=access_token,
            oauth_user_id=user.user_id,
        )
        db.add(oauth_record)
        db.commit()
        return user

    # 3. No user at all — create one, then link the OAuth record.
    candidate_role = (
        db.query(Role).filter(Role.role_name == "CANDIDATE").first()
    )
    if candidate_role is None:
        raise ValueError("CANDIDATE role not found in roles table")

    user = User(
        email=email,
        full_name=full_name,
        user_role_id=candidate_role.role_id,
    )
    db.add(user)
    db.flush()  # populate user.user_id before creating the OAuth record

    oauth_record = OAuth(
        oauth_provider="google",
        provider_user_id=provider_user_id,
        access_token=access_token,
        oauth_user_id=user.user_id,
    )
    db.add(oauth_record)
    db.commit()
    db.refresh(user)
    return user
