"""add images column to reviews

Revision ID: 0006
Revises: 0005
Create Date: 2026-03-17

"""
import sqlalchemy as sa
from alembic import op

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("reviews", sa.Column("images", sa.JSON(), nullable=True))


def downgrade() -> None:
    op.drop_column("reviews", "images")
