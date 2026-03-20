"""rename master_percentage to professional_percentage in invoices and earnings_splits

Revision ID: 0007
Revises: 0006
Create Date: 2026-03-20

Migration 0002 renamed master_id/salon_id FK columns but missed renaming
master_percentage → professional_percentage in invoices and earnings_splits.
"""
from alembic import op

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("invoices", "master_percentage", new_column_name="professional_percentage")
    op.alter_column("earnings_splits", "master_percentage", new_column_name="professional_percentage")


def downgrade() -> None:
    op.alter_column("invoices", "professional_percentage", new_column_name="master_percentage")
    op.alter_column("earnings_splits", "professional_percentage", new_column_name="master_percentage")
