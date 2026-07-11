from typing import Optional
from pydantic import BaseModel


class CodingTestCaseResponse(BaseModel):
    test_case_id: int
    description: Optional[str] = None
    question_id: int
    input_data: str
    expected_output: str
    is_hidden: bool


class CodingTestCaseCreate(BaseModel):
    description: Optional[str] = None
    input_data: str
    expected_output: str
    is_hidden: bool = True


class CodingTestCaseUpdate(BaseModel):
    description: Optional[str] = None
    input_data: Optional[str] = None
    expected_output: Optional[str] = None
    is_hidden: Optional[bool] = None


class Config:
    orm_mode = True
