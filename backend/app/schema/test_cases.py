from typing import Optional

from pydantic import BaseModel


class CodingTestCaseResponse(BaseModel):
    test_case_id: int
    description: Optional[str] = None
    question_id: int
    input_data: str
    expected_output: str
    is_hidden: bool

    class Config:
        orm_mode = True
