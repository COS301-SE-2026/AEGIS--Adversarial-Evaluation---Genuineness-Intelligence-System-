from sqlalchemy.orm import Session, selectinload

from app.models.role import Role
from app.models.user import User
from app.schema.user_management import UserRole


def get_all_candidates(db: Session) -> list:
    return (
        db.query(User)
        .join(Role, User.user_role_id == Role.role_id)
        .filter(Role.role_name == "CANDIDATE")
        .options(selectinload(User.role))
        .all()
    )


def list_users(
    db: Session,
    search: str | None = None,
) -> list:
    query = (
        db.query(User)
        .join(Role, User.user_role_id == Role.role_id)
        .options(selectinload(User.role))
        .order_by(User.user_id)
    )

    if search:
        search_value = f"%{search.strip()}%"
        query = query.filter(
            (User.email.ilike(search_value))
            | (User.full_name.ilike(search_value))
        )

    return query.all()


def change_user_role(
    db: Session,
    user_id: int,
    role_name: UserRole,
) -> User:
    user = db.query(User).filter(User.user_id == user_id).first()

    if user is None:
        raise ValueError("User not found")

    role = (
        db.query(Role)
        .filter(Role.role_name == role_name.value)
        .first()
    )

    if role is None:
        raise ValueError(f"Role {role_name.value} does not exist")

    user.user_role_id = role.role_id
    db.commit()
    db.refresh(user)

    return user

