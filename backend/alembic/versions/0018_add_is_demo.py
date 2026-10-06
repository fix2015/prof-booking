"""Add is_demo flag to providers, professionals and reviews (sample listings)

Revision ID: 0018
Revises: 0017
"""
import sqlalchemy as sa

from alembic import op

revision = "0018"
down_revision = "0017"
branch_labels = None
depends_on = None


def upgrade() -> None:
    for table in ("providers", "professionals", "reviews"):
        op.add_column(table, sa.Column("is_demo", sa.Boolean(), nullable=False, server_default=sa.false()))
        op.create_index(f"ix_{table}_is_demo", table, ["is_demo"])


def downgrade() -> None:
    for table in ("providers", "professionals", "reviews"):
        op.drop_index(f"ix_{table}_is_demo", table_name=table)
        op.drop_column(table, "is_demo")
