from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from app.models.candidate_assessment import CandidateAssessment
from app.models.candidate_response import CandidateResponse
from app.models.candidate_response_metrics import CandidateResponseMetrics
from app.schema.candidate_response_metrics import MetricsFlushRequest


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
       candidate_answer: str
) -> CandidateResponse:
    response = (
        db.query(CandidateResponse)
        .filter(CandidateResponse.response_id ==
                response_id)
        .first()
    )

    if response is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Response not found"
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


def flush_response_metrics(
       db: Session,
       candidate_response_id: int,
       candidate_id: int,
       payload: MetricsFlushRequest
) -> CandidateResponseMetrics:
    response = (
        db.query(CandidateResponse)
        .filter(CandidateResponse.response_id ==
                candidate_response_id)
        .first()
    )

    if response is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Response not found"
        )

    if candidate_id != response.candidate_assessment.candidate_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authenticated for this assessment"
        )

    metrics = (
        db.query(CandidateResponseMetrics)
        .filter(CandidateResponseMetrics.candidate_response_id ==
                candidate_response_id)
        .first()
    )

    if metrics is None:
        metrics = CandidateResponseMetrics(
            candidate_response_id=candidate_response_id,
            candidate_assessment_id=payload.candidate_assessment_id,
            active_time_ms=0,
            unique_keys_count=0,
            chars_alnum=0,
            chars_special=0,
            backspace_count=0,
            copy_event_count=0,
            paste_event_count=0,
            paste_char_count=0,
            focus_loss_count=0,
            focus_loss_time_ms=0,
        )
        db.add(metrics)

    delta = payload.delta
    metrics.active_time_ms += delta.active_time_ms
    metrics.chars_alnum += delta.chars_alnum
    metrics.chars_special += delta.chars_special
    metrics.backspace_count += delta.backspace_count
    metrics.copy_event_count += delta.copy_event_count
    metrics.paste_event_count += delta.paste_event_count
    metrics.paste_char_count += delta.paste_char_count
    metrics.focus_loss_count += delta.focus_loss_count
    metrics.focus_loss_time_ms += delta.focus_loss_time_ms
    metrics.unique_keys_count = max(
        metrics.unique_keys_count, payload.cumulative.unique_keys_count
    )

    db.commit()
    db.refresh(metrics)
    return metrics
