from sqlalchemy.orm import Session, selectinload
from sqlalchemy.exc import IntegrityError
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


def update_user(
    db: Session,
    user_id: int,
    email: str | None = None,
    full_name: str | None = None,
) -> User:
    user = (
        db.query(User)
        .filter(User.user_id == user_id)
        .first()
    )

    if user is None:
        raise ValueError("User not found")

    if email is not None:
        user.email = email

    if full_name is not None:
        user.full_name = full_name

    try:
        db.commit()
    except IntegrityError as exc:
        db.rollback()
        raise ValueError("A user with that email already exists") from exc

    db.refresh(user)
    return user


def delete_user(db: Session, user_id: int) -> None:
    user = (
        db.query(User)
        .filter(User.user_id == user_id)
        .first()
    )

    if user is None:
        raise ValueError("User not found")

    if user.assessments or user.sessions:
        raise ValueError(
            "This user cannot be deleted because they have related records"
        )
    for oauth_record in user.oauths:
        db.delete(oauth_record)

    db.delete(user)
    db.commit()
