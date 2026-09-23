from sqlalchemy import (
    BigInteger,
    CheckConstraint,
    Column,
    Float,
    ForeignKey,
    Integer,
    Text,
    TIMESTAMP
)
from sqlalchemy.orm import relationship
from app.models.base import Base
from enum import Enum as PyEnum
from sqlalchemy import Enum as SAEnum


class RecommendationStatus(str, PyEnum):
    NOT_REQUESTED = "not_requested"
    PENDING = "pending"
    ACCEPTED = "accepted"
    MODIFIED = "modified"
    REJECTED = "rejected"
    INSUFFICIENT_DATA = "insufficient_data"
    FAILED = "failed"


class AssessmentQuestion(Base):
    __tablename__ = "assessment_questions"

    __table_args__ = (
        CheckConstraint(
            "recruiter_weight IS NULL OR "
            "(recruiter_weight >= 0.0 AND recruiter_weight <= 1.0)",
            name="assessment_questions_recruiter_weight_check",
        ),
        CheckConstraint(
            "ai_suggested_weight IS NULL OR "
            "(ai_suggested_weight >= 0.0 AND ai_suggested_weight <= 1.0)",
            name="assessment_questions_ai_suggested_weight_check",
        ),
        CheckConstraint(
            "approved_weight IS NULL OR "
            "(approved_weight >= 0.0 AND approved_weight <= 1.0)",
            name="assessment_questions_approved_weight_check",
        ),
        CheckConstraint(
            "recommendation_status IN ("
            "'not_requested', 'pending', 'accepted', 'modified', "
            "'rejected', 'insufficient_data', 'failed'"
            ")",
            name="assessment_questions_recommendation_status_check",
        ),
    )

    assessment_q_id = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )
    assessments_id = Column(
        Integer,
        ForeignKey("assessments.assessment_id"),
        nullable=False,
    )
    adv_question_id = Column(
        Integer,
        ForeignKey("adversarial_questions.adv_question_id"),
        nullable=False,
    )
    display_order = Column(BigInteger, nullable=True)
    marks = Column(Float, nullable=True)

    recruiter_weight = Column(Float, nullable=True)
    ai_suggested_weight = Column(Float, nullable=True)
    approved_weight = Column(Float, nullable=True)

    recommendation_status = Column(
        SAEnum(
            RecommendationStatus,
            native_enum=False,
            validate_strings=True,
            values_callable=lambda statuses: [
                status.value for status in statuses
            ],
        ),
        nullable=False,
        default=RecommendationStatus.NOT_REQUESTED,
        server_default=RecommendationStatus.NOT_REQUESTED.value,
    )
    ai_recommendation = Column(Text, nullable=True)
    ai_generated_at = Column(TIMESTAMP, nullable=True)

    approved_by = Column(
        Integer,
        ForeignKey("users.user_id"),
        nullable=True,
    )
    approved_at = Column(TIMESTAMP, nullable=True)

    assessment = relationship(
        "Assessment",
        back_populates="assessment_questions",
    )
    adversarial_question = relationship(
        "AdversarialQuestion",
        back_populates="assessment_questions",
    )
    responses = relationship(
        "CandidateResponse",
        back_populates="assessment_question",
    )
    approver = relationship("User")

    @property
    def question_bank(self):
        if self.adversarial_question is not None:
            return self.adversarial_question.source_question
        return None
