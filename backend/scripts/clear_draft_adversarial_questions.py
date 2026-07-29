"""One-off maintenance: delete draft adversarial_questions rows.

Leaves every row with validation_status = 'validated' untouched.
Connects to the DB the same way build_question_pool.py does.

Usage:
    cd backend
    python scripts/clear_draft_adversarial_questions.py
"""

from __future__ import annotations

import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from app.database.database import SessionLocal  # noqa: E402
from app.models.adversarial_question import (  # noqa: E402
    AdversarialQuestion,
)


def count_by_status(db, status):
    return (
        db.query(AdversarialQuestion)
        .filter(AdversarialQuestion.validation_status == status)
        .count()
    )


def main():
    db = SessionLocal()
    try:
        draft_before = count_by_status(db, "draft")
        validated_before = count_by_status(db, "validated")
        print(
            f"Before: draft={draft_before} "
            f"validated={validated_before}",
            flush=True,
        )

        deleted = (
            db.query(AdversarialQuestion)
            .filter(AdversarialQuestion.validation_status == "draft")
            .delete(synchronize_session=False)
        )
        db.commit()
        print(f"Deleted {deleted} draft row(s).", flush=True)

        draft_after = count_by_status(db, "draft")
        validated_after = count_by_status(db, "validated")
        print(
            f"After:  draft={draft_after} "
            f"validated={validated_after}",
            flush=True,
        )
    finally:
        db.close()


if __name__ == "__main__":
    main()
