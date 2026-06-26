from pydantic import BaseModel, Field
from datetime import datetime


class CategoryResponse(BaseModel):
    category_id: int = Field(..., description="Unique category ID")
    category_name: str = Field(..., description="Name of the category")
    created_at: datetime = Field(..., description="Timestamp of creation")

    class Config:
        orm_mode = True
