"""
User service/business logic layer.
Provides helpers for finding and creating users used by authentication flows.
"""

from typing import Optional, Dict, Any, List

from sqlalchemy.orm import Session

from app.models.user import User, UserRole


def get_user_by_email(db: Session, email: str) -> Optional[User]:
    """Return a user by email or None if not found."""
    return db.query(User).filter(User.email == email).one_or_none()


def get_user_by_github_id(db: Session, github_id: str) -> Optional[User]:
    """Return a user by GitHub ID or None if not found."""
    return (
        db.query(User)
        .filter(User.github_id == str(github_id))
        .one_or_none()
    )


def _select_primary_email(emails: List[Dict[str, Any]]) -> Optional[str]:
    """
    Choose the best email from GitHub email list.
    """
    if not emails:
        return None

    # Primary + verified (best case)
    for e in emails:
        if e.get("primary") and e.get("verified"):
            return e.get("email")

    # Any verified email
    for e in emails:
        if e.get("verified"):
            return e.get("email")

    # Fallback to first email
    return emails[0].get("email")

def create_user_from_github(
    db: Session,
    user_info: Dict[str, Any],
    emails: List[Dict[str, Any]],
    role: UserRole = UserRole.CANDIDATE
) -> User:
    """
    Find or create a user from GitHub OAuth data.
    """

    github_id = str(user_info.get("id")) if user_info.get("id") else None

    # Try find by GitHub ID first
    if github_id:
        existing_user = get_user_by_github_id(db, github_id)
        if existing_user:
            return existing_user

    # Resolve best email
    primary_email = _select_primary_email(emails) or user_info.get("email")

    # Try find by email
    if primary_email:
        existing_user = get_user_by_email(db, primary_email)

        if existing_user:
            # Link GitHub account if missing
            if github_id and not existing_user.github_id:
                existing_user.github_id = github_id
                existing_user.auth_provider = "github"

                db.add(existing_user)
                db.commit()
                db.refresh(existing_user)

            return existing_user

    if not github_id and not primary_email:
        raise ValueError("GitHub user payload is missing both id and email")

    fallback_email = primary_email or f"{github_id or user_info.get('login')}@users.noreply.github.com"

    # Create new user
    new_user = User(
        auth_provider="github",
        github_id=github_id,
        email=fallback_email,
        full_name=user_info.get("name") or user_info.get("login"),
        role=role,
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user