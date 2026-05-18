from typing import Optional
from pydantic import BaseModel, Field
from datetime import datetime


class CandidateAssessmentResponse(BaseModel):
    candidate_assess_id: int = Field(..., description="Unique ID for the candidate assessment instance")
    status: str = Field(..., description="Current status, e.g. 'pending', 'in_progress', 'completed'")
    access_token: Optional[str] = Field(None, description="Short-lived access token for the candidate session")
    total_score: Optional[float] = Field(None, description="Total score achieved by the candidate, if available")
    start_time: Optional[datetime] = Field(None, description="Assessment start timestamp")
    end_time: Optional[datetime] = Field(None, description="Assessment end timestamp")

    class Config:
        orm_mode = True


class InviteCreate(BaseModel):
    candidate_id: int = Field(..., description="ID of the candidate to invite")
