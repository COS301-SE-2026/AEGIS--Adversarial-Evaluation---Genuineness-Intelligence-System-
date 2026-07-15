from typing import List

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.schema.adversarial import StrategyResponse
from app.services.adversarial_service import get_all_strategies

router = APIRouter(
    prefix="/adversarial-strategies", tags=["adversarial"]
)


@router.get(
    "/",
    response_model=List[StrategyResponse],
    status_code=status.HTTP_200_OK,
    summary="Get all adversarial strategies",
)
async def list_strategies(db: Session = Depends(get_db)):
    return get_all_strategies(db)
