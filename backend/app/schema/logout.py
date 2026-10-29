from pydantic import BaseModel


class LogoutResponse(BaseModel):
    message: str
