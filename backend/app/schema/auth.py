import re
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class RegisterRequest(BaseModel):
    email: EmailStr = Field(
        ...,
        description="The user's email address; must be a valid email format"
    )
    password: str = Field(
        ...,
        description="Min 8 chars, one uppercase, one number"
    )
    full_name: Optional[str] = Field(
        None,
        description="The user's full name — optional",
    )

    @field_validator("password")
    @classmethod
    def password_strength(cls, value: str) -> str:
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters")
        if not re.search(r"[A-Z]", value):
            raise ValueError(
                "Password must contain at least one uppercase letter."
            )
        if not re.search(r"[0-9]", value):
            raise ValueError("Password must include at least one number")
        if not re.search(r"[!@#$%^&*()_+\-=[\]{};':\"\\|,.<>\/?`~]", value):
            raise ValueError("Password must include at least one special char")
        return value


class LoginRequest(BaseModel):
    email: EmailStr = Field(
        ...,
        description="User's email address"
    )
    password: str = Field(
        ...,
        description="User's password"
    )


class UserResponse(BaseModel):
    id: int = Field(
        ...,
        description="The user's database id"
    )
    email: str = Field(
        ...,
        description="The user's emai"
    )
    full_name: Optional[str] = Field(
        None,
        description="The user's full name"
    )

    class Config:
        orm_mode = True


class RegisterResponse(BaseModel):
    user: UserResponse = Field(
        ...,
        description="The newly registered user's profile details"
    )
    access_token: str = Field(
        ...,
        description="Signed JWT for authenticated requests",
    )
    token_type: str = Field(
        "bearer",
        description="Token type. Always 'bearer' for JWT auth"
    )
    role: str = Field(
        ...,
        description="The user's role name (CANDIDATE or RECRUITER)",
    )


LoginResponse = RegisterResponse
