from datetime import datetime
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


class GenerateAdversarialRequest(BaseModel):
    source_question_id: int = Field(
        ..., description="ID of the source question"
    )
    strategy_id: int = Field(
        ..., description="ID of the adversarial strategy"
    )


class AdversarialQuestionResponse(BaseModel):
    adv_question_id: int = Field(
        ..., description="Unique adversarial question ID"
    )
    source_question_id: int = Field(
        ..., description="ID of the source question"
    )
    content: str = Field(
        ..., description="LLM-rewritten adversarial content"
    )
    strategy_id: int = Field(
        ..., description="ID of the adversarial strategy used"
    )
    llm: Optional[str] = Field(
        None, description="Which LLM generated this version"
    )
    generated_at: datetime = Field(
        ..., description="Timestamp of generation"
    )

    class Config:
        from_attributes = True
