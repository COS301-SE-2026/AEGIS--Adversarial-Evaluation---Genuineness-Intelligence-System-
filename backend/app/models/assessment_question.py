from sqlalchemy import BigInteger, Column, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base


class AssessmentQuestion(Base):
    __tablename__ = "assessment_questions"

    assessment_q_id = Column(Integer,
                             primary_key=True, autoincrement=True)
    assessments_id = Column(Integer,
                            ForeignKey("assessments.assessment_id"),
                            nullable=False)
    adv_question_id = Column(
        Integer,
        ForeignKey("adversarial_questions.adv_question_id"),
        nullable=False)
    display_order = Column(BigInteger, nullable=True)
    marks = Column(Float, nullable=True)

    assessment = relationship("Assessment",
                              back_populates="assessment_questions")
    adversarial_question = relationship("AdversarialQuestion")
    responses = relationship("CandidateResponse",
                             back_populates="assessment_question")
    question_bank = relationship(
        "QuestionBank",
        uselist=False,
        foreign_keys=[adv_question_id],
        primaryjoin="and_(foreign(AssessmentQuestion.adv_question_id) == "
                    "AdversarialQuestion.adv_question_id, "
                    "foreign(AdversarialQuestion.source_question_id) == "
                    "remote(QuestionBank.question_bank_id))",
        viewonly=True,
        lazy="joined"
    )
