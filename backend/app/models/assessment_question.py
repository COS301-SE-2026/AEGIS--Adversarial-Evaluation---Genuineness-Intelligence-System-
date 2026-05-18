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
    questions_id = Column(Integer,
                          ForeignKey("question_bank.question_bank_id"),
                          nullable=True)
    display_order = Column(BigInteger, nullable=True)
    marks = Column(Float, nullable=True)

    assessment = relationship("Assessment",
                              back_populates="assessment_questions")
    question_bank = relationship("QuestionBank")
    responses = relationship("CandidateResponse",
                             back_populates="assessment_question")
