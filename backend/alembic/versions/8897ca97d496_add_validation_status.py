"""add_validation_status

Revision ID: 8897ca97d496
Revises: 0e9432ede817
Create Date: 2026-07-22 00:00:00.000000

NOTE: This migration documents a schema change that was already
applied directly to the Supabase prod database.
Please do not run `alembic upgrade head` against
Supabase
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8897ca97d496'
down_revision: Union[str, Sequence[str], None] = '0e9432ede817'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.add_column(
        'adversarial_questions',
        sa.Column(
            'validation_status',
            sa.Text(),
            nullable=False,
            server_default='draft',
        ),
    )


def downgrade() -> None:
    """Downgrade schema."""
    op.drop_column('adversarial_questions', 'validation_status')
