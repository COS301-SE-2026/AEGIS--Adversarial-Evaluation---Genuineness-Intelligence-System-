from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session

from app.core.security import create_access_token
from app.database.database import get_db
from app.services.auth import (
    exchange_code_for_user_info,
    get_google_auth_url,
    get_or_create_user,
    register_user,
)

from app.schema.auth import RegisterRequest, RegisterResponse

router = APIRouter(prefix="/auth", tags=["auth"])


# Redirects the browser to Google's OAuth consent screen to begin login
@router.get("/google/login")
async def google_login():
    url = get_google_auth_url()
    return RedirectResponse(url=url, status_code=302)


# Receives Google's authorization code, exchanges it for user info,
# and returns a signed* JWT.
@router.get("/google/callback")
async def google_callback(
    code: str,
    error: str | None = None,
    db: Session = Depends(get_db),
):
    if error is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error,
        )

    user_info = exchange_code_for_user_info(code)
    user = get_or_create_user(db, user_info)

    token = create_access_token({
        "sub": user.email,
        "role": user.role.role_name,
        "user_id": str(user.user_id),
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.user_id,
            "email": user.email,
            "name": user.full_name,
            "role": user.role.role_name,
        },
    }

@router.post("/register", response_model=RegisterResponse, status_code=status.HTTP_201_CREATED)
def register(
    payload: RegisterRequest,
    db: Session = Depends(get_db),
) -> RegisterResponse:
    try:
        user, access_token = register_user(db, payload)
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=str(e),
        )
    return RegisterResponse(
        user={"id": user.user_id, "email": user.email, "full_name": user.full_name},
        access_token=access_token,
    )
