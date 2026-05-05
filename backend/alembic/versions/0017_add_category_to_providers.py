"""Add category column to providers

Revision ID: 0017
Revises: 0016
Create Date: 2026-05-05
"""
from alembic import op
import sqlalchemy as sa

revision = "0017"
down_revision = "0016"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("providers", sa.Column("category", sa.String(100), nullable=True))


def downgrade() -> None:
    op.drop_column("providers", "category")
