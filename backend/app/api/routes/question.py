from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from typing import List
from app.database.database import get_db
from app.schema.category import CategoryResponse
from app.services.question import get_all_categories

router = APIRouter(prefix="/categories", tags=["categories"])

@router.get(
    "/",
    response_model=List[CategoryResponse],
    status_code=status.HTTP_200_OK,
    summary="Get all question categories"
)
async def list_categories(
    db: Session = Depends(get_db)
):
    return get_all_categories(db)