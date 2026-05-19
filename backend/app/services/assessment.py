from datetime import datetime
import json
import uuid

from fastapi import HTTPException, status
from sqlalchemy.orm import Session, selectinload

from app.models.assessment import Assessment
from app.models.assessment_question import AssessmentQuestion
from app.models.candidate_assessment import CandidateAssessment, SessionStatus
from app.models.candidate_response import CandidateResponse, CorrectnessStatus
from app.models.user import User
from app.schema.candidate_response import ResponseCreate


def _norm(v):
    return str(v).strip().lower()


def _parse_candidate_answer(raw: str):
    try:
        return json.loads(raw or "")
    except Exception:
        return raw or ""


def _grade_candidate(qb, correct_answer, candidate_parsed):

    if correct_answer is None:
        return None, None

    max_score = qb.maximum_score or 0.0

    if isinstance(correct_answer, (list, tuple)):
        correct_set = set(map(_norm, correct_answer))

        if isinstance(candidate_parsed, (list, tuple)):
            cand_set = set(map(_norm, candidate_parsed))
            matched = cand_set & correct_set
            if cand_set == correct_set:
                return max_score, CorrectnessStatus.CORRECT
            if matched:
                fraction = len(matched) / len(correct_set)
                return max_score * fraction, CorrectnessStatus.PARTIAL
            return 0.0, CorrectnessStatus.INCORRECT

        if isinstance(candidate_parsed, dict):
            scalar = candidate_parsed.get("answer") or candidate_parsed.get(
                "value"
            )
            if scalar is not None and _norm(scalar) in correct_set:
                return max_score, CorrectnessStatus.CORRECT
            return 0.0, CorrectnessStatus.INCORRECT

        if _norm(candidate_parsed) in correct_set:
            return max_score, CorrectnessStatus.CORRECT
        return 0.0, CorrectnessStatus.INCORRECT

    if isinstance(correct_answer, dict):
        if isinstance(candidate_parsed, dict):
            if candidate_parsed == correct_answer:
                return max_score, CorrectnessStatus.CORRECT
            cand_scalar = (
                candidate_parsed.get("answer")
                or candidate_parsed.get("value")
            )
            expected_scalar = (
                correct_answer.get("answer")
                or correct_answer.get("value")
            )
            if (
                cand_scalar is not None
                and expected_scalar is not None
                and _norm(cand_scalar) == _norm(expected_scalar)
            ):
                return max_score, CorrectnessStatus.CORRECT
            return 0.0, CorrectnessStatus.INCORRECT

        expected_scalar = correct_answer.get("answer") or correct_answer.get(
            "value"
        )
        if expected_scalar is not None and _norm(expected_scalar) == _norm(
            candidate_parsed
        ):
            return max_score, CorrectnessStatus.CORRECT
        return 0.0, CorrectnessStatus.INCORRECT

    try:
        if _norm(correct_answer) == _norm(candidate_parsed):
            return max_score, CorrectnessStatus.CORRECT
        return 0.0, CorrectnessStatus.INCORRECT
    except Exception:
        return None, None


def get_all_assessments(db: Session) -> list[Assessment]:
    # Returns every assessment row without loading question details.
    return db.query(Assessment).all()


def get_assessment_by_id(
    db: Session, assessment_id: int
) -> Assessment | None:
    assessment = (
        db.query(Assessment)
        .options(
            selectinload(Assessment.assessment_questions)
            .selectinload(AssessmentQuestion.question_bank)
        )
        .filter(Assessment.assessment_id == assessment_id)
        .first()
    )
    if assessment is not None:
        assessment.assessment_questions.sort(
            key=lambda aq: (
                aq.display_order is None,
                aq.display_order or 0,
            )
        )
    return assessment


def save_candidate_response(
    db: Session,
    candidate_assessment_id: int,
    response_in: ResponseCreate,
) -> CandidateResponse:
    session = (
        db.query(CandidateAssessment)
        .filter(
            CandidateAssessment.candidate_assess_id
            == candidate_assessment_id
        )
        .first()
    )
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate assessment not found",
        )

    existing_response = (
        db.query(CandidateResponse)
        .filter(
            CandidateResponse.candidate_assessment_id
            == candidate_assessment_id,
            CandidateResponse.assessment_question_id
            == response_in.assessment_question_id,
        )
        .first()
    )

    if existing_response is not None:
        existing_response.candidate_answer = response_in.candidate_answer
        candidate_response = existing_response
    else:
        candidate_response = CandidateResponse(
            candidate_assessment_id=candidate_assessment_id,
            assessment_question_id=response_in.assessment_question_id,
            candidate_answer=response_in.candidate_answer,
        )
        db.add(candidate_response)

    assessment_q = (
        db.query(AssessmentQuestion)
        .options(selectinload(AssessmentQuestion.question_bank))
        .filter(
            AssessmentQuestion.assessment_q_id
            == response_in.assessment_question_id
        )
        .first()
    )

    if assessment_q is not None and assessment_q.question_bank is not None:
        qb = assessment_q.question_bank
        correct_answer = qb.correct_answer
        candidate_parsed = _parse_candidate_answer(
            response_in.candidate_answer
        )

        score, correctness_status = _grade_candidate(
            qb, correct_answer, candidate_parsed
        )
        candidate_response.score = score
        candidate_response.is_correct = correctness_status
    else:
        candidate_response.score = None
        candidate_response.is_correct = None

    db.commit()
    db.refresh(candidate_response)
    return candidate_response


def get_candidate_responses(
    db: Session,
    candidate_assessment_id: int,
) -> list[CandidateResponse]:
    session = (
        db.query(CandidateAssessment)
        .filter(
            CandidateAssessment.candidate_assess_id
            == candidate_assessment_id
        )
        .first()
    )
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate assessment not found",
        )

    return (
        db.query(CandidateResponse)
        .filter(
            CandidateResponse.candidate_assessment_id
            == candidate_assessment_id
        )
        .all()
    )


def submit_candidate_assessment(
    db: Session,
    candidate_assessment_id: int,
) -> CandidateAssessment:
    session = (
        db.query(CandidateAssessment)
        .options(
            selectinload(CandidateAssessment.responses),
            selectinload(CandidateAssessment.assessment)
            .selectinload(Assessment.assessment_questions)
            .selectinload(AssessmentQuestion.question_bank),
        )
        .filter(
            CandidateAssessment.candidate_assess_id
            == candidate_assessment_id
        )
        .first()
    )
    if session is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate assessment not found",
        )

    candidate_score = sum((resp.score or 0.0) for resp in session.responses)

    total_score = 0.0
    for aq in session.assessment.assessment_questions:
        if aq.marks is not None:
            total_score += aq.marks
        elif (
            aq.question_bank is not None
            and aq.question_bank.maximum_score is not None
        ):
            total_score += aq.question_bank.maximum_score

    session.candidate_score = candidate_score
    session.total_score = total_score
    session.status = SessionStatus.COMPLETED
    session.end_time = datetime.utcnow()

    db.commit()
    db.refresh(session)
    return session


def create_candidate_assessment(
    db: Session,
    assessment_id: int,
    candidate_id: int,
) -> CandidateAssessment:
    assessment = (
        db.query(Assessment)
        .filter(Assessment.assessment_id == assessment_id)
        .first()
    )
    if assessment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Assessment not found",
        )

    candidate = (
        db.query(User)
        .filter(User.user_id == candidate_id)
        .first()
    )
    if candidate is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Candidate not found",
        )

    existing = (
        db.query(CandidateAssessment)
        .filter(
            CandidateAssessment.candidate_id == candidate_id,
            CandidateAssessment.assessment_id == assessment_id,
        )
        .first()
    )
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Candidate has already been invited to this assessment",
        )

    access_token = str(uuid.uuid4())
    new_session = CandidateAssessment(
        assessment_id=assessment_id,
        candidate_id=candidate_id,
        access_token=access_token,
        status=SessionStatus.STARTED,
        candidate_score=None,
        total_score=None,
        start_time=None,
        end_time=None,
    )
    db.add(new_session)
    db.commit()
    db.refresh(new_session)
    return new_session
