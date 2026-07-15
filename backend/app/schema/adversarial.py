from typing import Optional

from pydantic import BaseModel, Field


class StrategyResponse(BaseModel):
    strategy_id: int = Field(..., description="Unique strategy ID")
    strategy_name: str = Field(..., description="Name of the strategy")
    description: Optional[str] = Field(
        None, description="Strategy description"
    )
    trap_mechanism_summary: Optional[str] = Field(
        None, description="Summary of the trap mechanism"
    )

    class Config:
        from_attributes = True
