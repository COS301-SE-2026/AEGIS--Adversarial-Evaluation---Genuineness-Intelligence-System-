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
    correct_answer: Optional[str] = Field(
        None, description="Correct answer to the question"
    )
    predicted_wrong_answer: Optional[str] = Field(
        None, description="Predicted incorrect AI answer"
    )
    trap_mechanism: Optional[str] = Field(
        None, description="How the adversarial trap works"
    )
    pattern_used: Optional[str] = Field(
        None, description="Adversarial pattern used"
    )
    validation_status: str = Field(
        ..., description="Validation status of the question"
    )

    class Config:
        from_attributes = True


class TestCaseResult(BaseModel):
    test_case_id: int = Field(..., description="Test case ID")
    input_data: str = Field(..., description="Test case input")
    expected_output: str = Field(
        ..., description="Expected test case output"
    )
    actual_output: Optional[str] = Field(
        None, description="Actual output produced"
    )
    passed: bool = Field(
        ..., description="Whether the output matched expected"
    )


class CodeExecutionComparison(BaseModel):
    correct_answer_results: list[TestCaseResult] = Field(
        ..., description="Test results for the correct answer"
    )
    gemini_results: list[TestCaseResult] = Field(
        ..., description="Test results for Gemini's response"
    )


class ValidationResult(BaseModel):
    adv_question_id: int = Field(
        ..., description="Unique adversarial question ID"
    )
    weaponised_question: str = Field(
        ..., description="The weaponised question sent to Gemini"
    )
    correct_answer: str = Field(
        ..., description="Stored correct answer for the weaponised item"
    )
    source_question_correct_answer: str = Field(
        ..., description="Correct answer of the original source question"
    )
    predicted_wrong_answer: str = Field(
        ..., description="Stored predicted wrong answer"
    )
    gemini_response: str = Field(
        ..., description="Gemini's raw response text"
    )
    gemini_took_bait: bool = Field(
        ..., description="Whether Gemini's response took the bait"
    )
    question_type: str = Field(
        ..., description="Type of the source question"
    )
    test_case_results: Optional[CodeExecutionComparison] = Field(
        None, description="Code execution comparison, if applicable"
    )
    piston_note: Optional[str] = Field(
        None, description="Note if Piston execution was skipped"
    )
