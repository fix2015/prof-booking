"""Add sessions.late_cancelled (owner marks a late cancellation; feeds analytics)

Revision ID: 0021
Revises: 0020
"""
import sqlalchemy as sa

from alembic import op

revision = "0021"
down_revision = "0020"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "sessions", sa.Column("late_cancelled", sa.Boolean(), nullable=False, server_default=sa.false())
    )


def downgrade() -> None:
    op.drop_column("sessions", "late_cancelled")
