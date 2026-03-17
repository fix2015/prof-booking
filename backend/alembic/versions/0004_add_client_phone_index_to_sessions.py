"""add index on sessions.client_phone

Revision ID: 0004
Revises: 0003
Create Date: 2026-03-17

"""
from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_index("ix_sessions_client_phone", "sessions", ["client_phone"])


def downgrade() -> None:
    op.drop_index("ix_sessions_client_phone", table_name="sessions")
