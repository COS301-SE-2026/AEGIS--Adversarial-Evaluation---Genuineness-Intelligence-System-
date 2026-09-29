"""add_adversarial_question_reference_approach

Revision ID: 01f814141d98
Revises: c16a9ee5b58d
Create Date: 2026-09-29 00:00:00.000000

NOTE: This migration is an audit-trail record of a schema change
applied directly to the Supabase prod database (and to the local
Docker Postgres). It has NOT been run via Alembic. Please do not run
`alembic upgrade head` against Supabase -- the column already exists;
apply the ALTER TABLE SQL manually instead.

The change recorded here is:

    ALTER TABLE adversarial_questions
        ADD COLUMN IF NOT EXISTS reference_approach TEXT;

This nullable column holds a short, single-sentence description of a
non-scoring implementation choice Gemini made while generating a
CODING adversarial question (e.g. "solved iteratively rather than
recursively"), captured once at generation time in the same call that
produces weaponised_question/correct_answer/predicted_wrong_answer/
trap_mechanism/pattern_used and reused for every candidate who attempts
that question. It is always null for MCQ and fill-in-the-blank
questions.
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '01f814141d98'
down_revision: Union[str, Sequence[str], None] = 'c16a9ee5b58d'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'adversarial_questions',
        sa.Column('reference_approach', sa.Text(), nullable=True),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('adversarial_questions', 'reference_approach')
