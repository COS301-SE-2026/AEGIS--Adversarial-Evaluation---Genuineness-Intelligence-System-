from fastapi import APIRouter, Depends, status, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database.database import get_db
from app.schema.user_management import (
    ChangeUserRoleRequest,
    UserManagementResponse,
    UpdateUserRequest,
)
from app.services.user import (
    get_all_candidates,
    change_user_role,
    list_users,
    delete_user,
    update_user,
)


router = APIRouter(prefix="/users", tags=["users"])


def require_recruiter(current_user: dict) -> None:
    if current_user.get("role") != "RECRUITER":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only recruiters can manage users.",
        )


def serialise_user(user) -> UserManagementResponse:
    return UserManagementResponse(
        user_id=user.user_id,
        email=user.email,
        full_name=user.full_name,
        role=user.role.role_name,
    )


@router.get(
    "",
    response_model=list[UserManagementResponse],
    status_code=status.HTTP_200_OK,
)
def list_managed_users(
    search: str | None = Query(default=None),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    require_recruiter(current_user)

    users = list_users(db, search=search)
    return [serialise_user(user) for user in users]


@router.patch(
    "/{user_id}/role",
    response_model=UserManagementResponse,
    status_code=status.HTTP_200_OK,
)
def update_user_role(
    user_id: int,
    payload: ChangeUserRoleRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    require_recruiter(current_user)

    current_user_id = int(current_user.get("user_id", -1))

    if current_user_id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot change your own role.",
        )

    try:
        user = change_user_role(db, user_id, payload.role)
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc

    return serialise_user(user)


@router.get(
    "/candidates",
    status_code=status.HTTP_200_OK,
)
async def list_candidates(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    require_recruiter(current_user)
    candidates = get_all_candidates(db)
    return [
        {
            "user_id": u.user_id,
            "email": u.email,
            "full_name": u.full_name,
        }
        for u in candidates
    ]


@router.patch(
    "/{user_id}",
    response_model=UserManagementResponse,
    status_code=status.HTTP_200_OK,
)
def edit_user(
    user_id: int,
    payload: UpdateUserRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    require_recruiter(current_user)

    try:
        user = update_user(
            db,
            user_id,
            email=payload.email,
            full_name=payload.full_name,
        )
    except ValueError as exc:
        detail = str(exc)
        error_status = (
            status.HTTP_409_CONFLICT
            if "already exists" in detail
            else status.HTTP_404_NOT_FOUND
        )
        raise HTTPException(
            status_code=error_status,
            detail=detail,
        ) from exc

    return serialise_user(user)


@router.delete(
    "/{user_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def remove_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    require_recruiter(current_user)

    current_user_id = int(current_user.get("user_id", -1))

    if current_user_id == user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot delete your own account.",
        )

    try:
        delete_user(db, user_id)
    except ValueError as exc:
        detail = str(exc)
        error_status = (
            status.HTTP_409_CONFLICT
            if "related records" in detail
            else status.HTTP_404_NOT_FOUND
        )
        raise HTTPException(
            status_code=error_status,
            detail=detail,
        ) from exc
