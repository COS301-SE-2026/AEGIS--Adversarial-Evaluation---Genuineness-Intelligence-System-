import enum
import uuid
from sqlalchemy import (
    CheckConstraint,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    Text,
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship

from app.models.base import Base


class RecommendationSetStatus(str, enum.Enum):
    PENDING = "pending"
    DECIDED = "decided"
    EXPIRED = "expired"


class IntegrityWeightRecommendationSet(Base):
    __tablename__ = "integrity_weight_recommendation_sets"

    recommendation_id = Column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )
    recruiter_id = Column(
        Integer,
        ForeignKey("users.user_id", ondelete="CASCADE"),
        nullable=False,
    )
    status = Column(
        Text,
        nullable=False,
        default=RecommendationSetStatus.PENDING.value,
        server_default=RecommendationSetStatus.PENDING.value,
    )
    created_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default="now()",
    )
    expires_at = Column(
        DateTime(timezone=True),
        nullable=True,
    )

    items = relationship(
        "IntegrityWeightRecommendationItem",
        back_populates="recommendation_set",
        cascade="all, delete-orphan",
        order_by="IntegrityWeightRecommendationItem.adv_question_id",
    )

    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'decided', 'expired')",
            name="recommendation_sets_status_check",
        ),
    )


class IntegrityWeightRecommendationItem(Base):
    __tablename__ = "integrity_weight_recommendation_items"

    recommendation_item_id = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )
    recommendation_id = Column(
        UUID(as_uuid=True),
        ForeignKey(
            "integrity_weight_recommendation_sets.recommendation_id",
            ondelete="CASCADE",
        ),
        nullable=False,
    )
    adv_question_id = Column(
        Integer,
        ForeignKey(
            "adversarial_questions.adv_question_id",
            ondelete="RESTRICT",
        ),
        nullable=False,
    )
    recruiter_weight = Column(Float, nullable=True)

    ai_suggested_weight = Column(Float, nullable=True)
    ai_recommendation = Column(Text, nullable=True)
    ai_generated_at = Column(DateTime(timezone=True), nullable=True)

    recruiter_decision = Column(Text, nullable=True)
    approved_weight = Column(Float, nullable=True)
    decided_at = Column(DateTime(timezone=True), nullable=True)

    recommendation_set = relationship(
        "IntegrityWeightRecommendationSet",
        back_populates="items",
    )
    adversarial_question = relationship("AdversarialQuestion")

    __table_args__ = (
        CheckConstraint(
            "recruiter_weight IS NULL OR "
            "(recruiter_weight >= 0.0 AND recruiter_weight <= 1.0)",
            name="recommendation_items_recruiter_weight_check",
        ),
        CheckConstraint(
            "ai_suggested_weight IS NULL OR "
            "(ai_suggested_weight >= 0.0 AND ai_suggested_weight <= 1.0)",
            name="recommendation_items_ai_weight_check",
        ),
        CheckConstraint(
            "approved_weight IS NULL OR "
            "(approved_weight >= 0.0 AND approved_weight <= 1.0)",
            name="recommendation_items_approved_weight_check",
        ),
        CheckConstraint(
            "recruiter_decision IS NULL OR "
            "recruiter_decision IN ('accept', 'modify', 'reject')",
            name="recommendation_items_decision_check",
        ),
        CheckConstraint(
            "(recruiter_decision = 'modify' AND approved_weight IS NOT NULL) "
            "OR recruiter_decision <> 'modify' "
            "OR recruiter_decision IS NULL",
            name="recommendation_items_modify_weight_check",
        ),
    )
