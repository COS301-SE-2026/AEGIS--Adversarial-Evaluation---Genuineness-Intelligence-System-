from pydantic import BaseModel, Field
from datetime import datetime


class CategoryResponse(BaseModel):
    category_id: int = Field(..., description="Unique category ID")
    category_name: int = Field(..., description="Name of the category")

    class Config:
        orm_mode = True