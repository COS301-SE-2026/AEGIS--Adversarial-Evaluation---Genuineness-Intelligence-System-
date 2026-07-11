from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.candidate_assessment import CandidateAssessment
from app.models.candidate_response import CandidateResponse

def get_candidate_assessment_session(
    db: Session,
    candidate_assessment_id: int,
    candidate_id: int
) -> CandidateAssessment:
    session = (
        db.query(CandidateAssessment)
        .filter(CandidateAssessment.candidate_assess_id ==
                candidate_assessment_id)
        .first()
    )

    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment session not found"
        )

    if session.candidate_id != candidate_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Invalid token"
        )

    return session

def update_response(
       db: Session,
       response_id: int,
       candidate_id: int,
       candidate_answer: int 
)->CandidateResponse:
    response = (
        db.query(CandidateResponse)
        .filter(CandidateResponse.response_id == 
                response_id)
        .first()
    )

    if response is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Reponse not found"
        )
    
    if candidate_id != response.candidate_assessment.candidate_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authenticated for this assessment"
        )
    
    response.candidate_answer = candidate_answer
    db.commit()
    db.refresh(response)
    return response