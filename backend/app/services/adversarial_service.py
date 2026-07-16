import json
from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from app.core.gemini import get_gemini_model
from app.models.adversarial_question import AdversarialQuestion
from app.models.adversarial_strategies import AdversarialStrategy
from app.models.assessment import Assessment
from app.models.assessment_question import AssessmentQuestion
from app.models.question_bank import QuestionBank

_WEAPONISER_DIR = Path(__file__).parent.parent / "core" / "weaponiser"
_SYSTEM_PROMPT_PATH = _WEAPONISER_DIR / "weaponiser_system_prompt.md"
_SEED_LIBRARY_PATH = _WEAPONISER_DIR / "aegis_seed_library.json"

_REQUIRED_FIELDS = (
    "weaponised_question",
    "correct_answer",
    "predicted_wrong_answer",
    "trap_mechanism",
    "pattern_used",
)


def _load_system_prompt() -> str:
    return _SYSTEM_PROMPT_PATH.read_text(encoding="utf-8")


def _load_few_shot_examples(strategy_name: str) -> list[dict]:
    with open(_SEED_LIBRARY_PATH, encoding="utf-8") as seed_file:
        seed_library = json.load(seed_file)
    matches = [
        item for item in seed_library
        if item.get("pattern_used") == strategy_name
    ]
    return matches[:2]


def _format_few_shot_examples(examples: list[dict]) -> str:
    blocks = []
    for example in examples:
        blocks.append(
            "Question: {}\n"
            "Correct answer: {}\n"
            "Predicted wrong answer: {}\n"
            "Trap mechanism: {}".format(
                example.get("weaponised_question"),
                example.get("correct_answer"),
                example.get("predicted_wrong_answer"),
                example.get("trap_mechanism"),
            )
        )
    return "\n\n".join(blocks)


def _build_user_message(
    strategy: AdversarialStrategy,
    source_question: QuestionBank,
    examples_block: str,
) -> str:
    return (
        f"Pattern: {strategy.strategy_name}\n"
        f"Topic: {source_question.title}\n"
        f"Difficulty: {source_question.difficulty}\n\n"
        f"Here are example items for this pattern:\n"
        f"{examples_block}\n\n"
        f"Now generate one item for the pattern and topic above."
    )


def _parse_gemini_response(raw_text: str) -> dict:
    try:
        parsed = json.loads(raw_text)
    except (json.JSONDecodeError, TypeError) as exc:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Gemini response was not valid JSON",
        ) from exc

    missing = [
        field for field in _REQUIRED_FIELDS if field not in parsed
    ]
    if missing:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=(
                "Gemini response missing required fields: "
                + ", ".join(missing)
            ),
        )
    return parsed


def generate_adversarial_question(
    db: Session,
    source_question_id: int,
    strategy_id: int,
) -> AdversarialQuestion:
    source_question = (
        db.query(QuestionBank)
        .filter(QuestionBank.question_bank_id == source_question_id)
        .first()
    )
    if source_question is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Source question not found",
        )

    strategy = (
        db.query(AdversarialStrategy)
        .filter(AdversarialStrategy.strategy_id == strategy_id)
        .first()
    )
    if strategy is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Adversarial strategy not found",
        )

    system_prompt = _load_system_prompt()
    examples = _load_few_shot_examples(strategy.strategy_name)
    examples_block = _format_few_shot_examples(examples)
    user_message = _build_user_message(
        strategy,
        source_question,
        examples_block,
    )

    model = get_gemini_model(system_instruction=system_prompt)
    response = model.generate_content(
        user_message,
        generation_config={
            "temperature": 0.0,
            "response_mime_type": "application/json",
        },
    )

    parsed = _parse_gemini_response(response.text)

    adversarial_question = AdversarialQuestion(
        source_question_id=source_question_id,
        content=parsed["weaponised_question"],
        strategy_id=strategy_id,
        llm="gemini-2.5-flash",
        generated_at=datetime.now(timezone.utc),
    )
    db.add(adversarial_question)
    db.commit()
    db.refresh(adversarial_question)
    return adversarial_question


def get_all_strategies(db: Session) -> list:
    return db.query(AdversarialStrategy).all()


def verify_assessment_exists(db: Session, assessment_id: int) -> Assessment:
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
    return assessment


def get_adversarial_questions_for_assessment(
    db: Session, assessment_id: int
) -> list:
    verify_assessment_exists(db, assessment_id)
    return (
        db.query(AdversarialQuestion)
        .join(
            AssessmentQuestion,
            AssessmentQuestion.adv_question_id
            == AdversarialQuestion.adv_question_id,
        )
        .filter(AssessmentQuestion.assessments_id == assessment_id)
        .all()
    )
