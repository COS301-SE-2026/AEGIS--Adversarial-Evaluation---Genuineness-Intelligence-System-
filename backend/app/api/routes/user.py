from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user
from app.database.database import get_db
from app.services.user import get_all_candidates

router = APIRouter(prefix="/users", tags=["users"])


@router.get(
    "/candidates",
    status_code=status.HTTP_200_OK,
)
async def list_candidates(
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    candidates = get_all_candidates(db)
    return [
        {
            "user_id": u.user_id,
            "email": u.email,
            "full_name": u.full_name,
        }
        for u in candidates
    ]
