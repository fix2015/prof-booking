"""rename master_earnings/salon_earnings to professional_earnings/provider_earnings in invoices

Revision ID: 0008
Revises: 0007
Create Date: 2026-03-21

Migration 0002 renamed master/salon to professional/provider in FK columns
but missed renaming master_earnings → professional_earnings and
salon_earnings → provider_earnings in the invoices table.
"""
from alembic import op

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column("invoices", "master_earnings", new_column_name="professional_earnings")
    op.alter_column("invoices", "salon_earnings", new_column_name="provider_earnings")


def downgrade() -> None:
    op.alter_column("invoices", "professional_earnings", new_column_name="master_earnings")
    op.alter_column("invoices", "provider_earnings", new_column_name="salon_earnings")
