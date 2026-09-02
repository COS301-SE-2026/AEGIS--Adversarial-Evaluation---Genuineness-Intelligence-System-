from enum import Enum
from pydantic import BaseModel, EmailStr


class UserRole(str, Enum):
    RECRUITER = "RECRUITER"
    CANDIDATE = "CANDIDATE"


class UserManagementResponse(BaseModel):
    user_id: int
    email: EmailStr
    full_name: str | None
    role: UserRole


class ChangeUserRoleRequest(BaseModel):
    role: UserRole


class UpdateUserRequest(BaseModel):
    email: EmailStr | None = None
    full_name: str | None = None
