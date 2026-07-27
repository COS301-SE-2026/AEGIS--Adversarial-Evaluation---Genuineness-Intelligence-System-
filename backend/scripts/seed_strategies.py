"""Seed the adversarial_strategies table with the 10 trap
patterns. Safe to run multiple times: existing rows are
matched by strategy_name and skipped.
"""
import os
import sys

sys.path.insert(
    0, os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

from app.database.database import SessionLocal  # noqa: E402
from app.models.adversarial_strategies import (  # noqa: E402
    AdversarialStrategy,
)


STRATEGIES = [
    {
        "strategy_name": "SYMBOL_REDEFINITION",
        "description": (
            "An operator or keyword is explicitly redefined in "
            "the question spec or via overloading."
        ),
        "trap_mechanism_summary": (
            "The model applies the token's entrenched canonical "
            "meaning instead of the local redefinition stated in "
            "the question."
        ),
    },
    {
        "strategy_name": "INVERTED_BOOLEAN",
        "description": (
            "A predicate's body returns the logical opposite of "
            "what its name implies."
        ),
        "trap_mechanism_summary": (
            "The model answers from the function name without "
            "tracing the actual body logic."
        ),
    },
    {
        "strategy_name": "IDENTIFIER_SWAP",
        "description": (
            "Two standard identifiers are reassigned to each "
            "other at the top of the snippet."
        ),
        "trap_mechanism_summary": (
            "The model resolves each name to its canonical "
            "function, ignoring the rebinding."
        ),
    },
    {
        "strategy_name": "NEGATION_INJECTION",
        "description": (
            "A 'not', 'EXCEPT', or 'NOT' is placed in the stem "
            "to flip the correct selection target."
        ),
        "trap_mechanism_summary": (
            "The model answers the higher-frequency un-negated "
            "version of the question."
        ),
    },
    {
        "strategy_name": "GARDEN_PATH_CRT",
        "description": (
            "A cognitive-reflection structure where the fluent "
            "System-1 completion is wrong and only deliberate "
            "computation gives the correct value."
        ),
        "trap_mechanism_summary": (
            "The model reproduces the intuitive fast answer "
            "without solving the underlying equation or "
            "reasoning chain."
        ),
    },
    {
        "strategy_name": "MODUS_TOLLENS",
        "description": (
            "A conditional P implies Q is given with not-Q; the "
            "valid conclusion is not-P."
        ),
        "trap_mechanism_summary": (
            "The model defaults to 'undetermined' or affirms P "
            "because it handles the contrapositive worse than "
            "modus ponens."
        ),
    },
    {
        "strategy_name": "REVERSAL_CURSE",
        "description": (
            "A fact normally memorised in one direction is "
            "queried in the reverse direction; the fact must "
            "not appear in the question itself."
        ),
        "trap_mechanism_summary": (
            "The reverse direction is under-represented in "
            "training so the model substitutes a high-prior "
            "forward-direction association."
        ),
    },
    {
        "strategy_name": "SURFACE_FORM_COMPETITION",
        "description": (
            "The correct answer occupies a low-probability "
            "surface form while a fluent higher-probability "
            "paraphrase is a distractor."
        ),
        "trap_mechanism_summary": (
            "The model prefers the more probable string over "
            "the correct but less frequent surface form."
        ),
    },
    {
        "strategy_name": "IRRELEVANT_CONTEXT",
        "description": (
            "Plausible but irrelevant details are inserted with "
            "at least one decoy resembling a tempting wrong "
            "answer."
        ),
        "trap_mechanism_summary": (
            "The model is pulled off the single real constraint "
            "by the salient irrelevant figures planted in the "
            "question."
        ),
    },
    {
        "strategy_name": "NONE_OF_THE_ABOVE",
        "description": (
            "The genuinely correct answer is absent from the "
            "listed options and none of the above is correct; "
            "distractors are near-misses."
        ),
        "trap_mechanism_summary": (
            "The model matches a lexical token from the "
            "question to a distractor option instead of "
            "recognising the correct answer is absent."
        ),
    },
]


def seed_strategies() -> None:
    db = SessionLocal()
    try:
        existing = {
            row.strategy_name
            for row in db.query(AdversarialStrategy.strategy_name).all()
        }
        created = 0
        for strategy in STRATEGIES:
            if strategy["strategy_name"] in existing:
                continue
            db.add(AdversarialStrategy(**strategy))
            created += 1
        db.commit()
        print(f"Seeded {created} new strategies "
              f"({len(STRATEGIES) - created} already present).")
    finally:
        db.close()


if __name__ == "__main__":
    seed_strategies()
