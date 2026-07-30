"""Validate all draft adversarial questions against Gemini.

Calls validate_adversarial_question on every draft row,
saves questions where Gemini took the bait, and writes a
report to scripts/validate_draft_report.json.

Usage:
    cd backend
    python scripts/validate_draft_questions.py
"""

from __future__ import annotations

import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = SCRIPT_DIR.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

from sqlalchemy import select  # noqa: E402

from app.database.database import SessionLocal  # noqa: E402
from app.models.adversarial_question import (  # noqa: E402
    AdversarialQuestion,
)
from app.services.adversarial_service import (  # noqa: E402
    save_adversarial_question,
    validate_adversarial_question,
)

REPORT_PATH = SCRIPT_DIR / "validate_draft_report.json"
SLEEP_SECONDS = 8


def main() -> None:
    db = SessionLocal()
    results = []

    try:
        stmt = (
            select(AdversarialQuestion)
            .where(
                AdversarialQuestion.validation_status
                == "draft"
            )
            .order_by(AdversarialQuestion.adv_question_id)
        )
        drafts = list(db.scalars(stmt).all())
        print(
            f"Found {len(drafts)} draft question(s) to "
            f"validate.",
            flush=True,
        )

        for q in drafts:
            adv_id = q.adv_question_id
            pattern = q.pattern_used or "unknown"
            print(
                f"[id={adv_id}, pattern={pattern}] "
                f"Validating...",
                flush=True,
            )
            record = {
                "adv_question_id": adv_id,
                "source_question_id": q.source_question_id,
                "pattern_used": pattern,
                "outcome": "error",
                "gemini_took_bait": False,
                "gemini_response": "",
                "error_message": None,
            }

            try:
                result = validate_adversarial_question(
                    db, adv_id
                )
                record["gemini_took_bait"] = (
                    result.gemini_took_bait
                )
                record["gemini_response"] = (
                    result.gemini_response or ""
                )

                if result.gemini_took_bait:
                    save_adversarial_question(db, adv_id)
                    record["outcome"] = "validated"
                    print(
                        f"[id={adv_id}, pattern={pattern}]"
                        f" VALIDATED",
                        flush=True,
                    )
                else:
                    record["outcome"] = "failed"
                    print(
                        f"[id={adv_id}, pattern={pattern}]"
                        f" did not take the bait",
                        flush=True,
                    )

            except Exception as exc:
                db.rollback()
                record["error_message"] = str(exc)
                print(
                    f"[id={adv_id}, pattern={pattern}]"
                    f" ERROR - {exc}",
                    flush=True,
                )

            results.append(record)
            time.sleep(SLEEP_SECONDS)

    finally:
        def count(outcome: str) -> int:
            return sum(
                1 for r in results
                if r["outcome"] == outcome
            )

        report = {
            "run_at": datetime.now(
                timezone.utc
            ).isoformat(),
            "total": len(results),
            "validated": count("validated"),
            "failed": count("failed"),
            "errors": count("error"),
            "results": results,
        }
        REPORT_PATH.write_text(
            json.dumps(report, indent=2)
        )
        print(
            f"\nReport written to {REPORT_PATH}",
            flush=True,
        )
        print("\n" + "=" * 52, flush=True)
        print("VALIDATION SUMMARY", flush=True)
        print("=" * 52, flush=True)
        print(f"Total drafts:  {report['total']}")
        print(f"Validated:     {report['validated']}")
        print(f"Failed:        {report['failed']}")
        print(f"Errors:        {report['errors']}")
        print("=" * 52, flush=True)
        db.close()


if __name__ == "__main__":
    main()