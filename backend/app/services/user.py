from sqlalchemy.orm import Session, selectinload

from app.models.role import Role
from app.models.user import User


def get_all_candidates(db: Session) -> list:
    return (
        db.query(User)
        .join(Role, User.user_role_id == Role.role_id)
        .filter(Role.role_name == "CANDIDATE")
        .options(selectinload(User.role))
        .all()
    )
