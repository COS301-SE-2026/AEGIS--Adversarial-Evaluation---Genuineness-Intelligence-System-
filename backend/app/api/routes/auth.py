"""Authentication routes for GitHub OAuth and JWT issuance."""

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session

from app.api.routes.users import router as users_router
from app.core.oauth import oauth_client
from app.core.security import create_access_token, create_refresh_token
from app.database.database import get_db
from app.services.users import create_user_from_github

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/github/login")
def github_login(state: str | None = Query(default=None)):
    """Return the GitHub authorization URL for the frontend to redirect to."""
    return {"authorization_url": oauth_client.get_authorization_url(state=state)}


@router.get("/github/callback")
async def github_callback(
    code: str = Query(..., description="Authorization code returned by GitHub"),
    db: Session = Depends(get_db),
):
    """Exchange the GitHub code, create or find the user, and issue JWTs."""
    try:
        auth_data = await oauth_client.authenticate_user(code)
        user = create_user_from_github(db, auth_data["user_info"], auth_data["emails"])
        access_token = create_access_token(str(user.id))
        refresh_token = create_refresh_token(str(user.id))

        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "email": user.email,
                "full_name": user.full_name,
                "role": user.role.value if hasattr(user.role, "value") else user.role,
                "auth_provider": user.auth_provider,
            },
            "github": {
                "id": auth_data["user_info"].get("id"),
                "login": auth_data["user_info"].get("login"),
            },
        }
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc)) from exc
    except Exception as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=f"GitHub authentication failed: {exc}") from exc
