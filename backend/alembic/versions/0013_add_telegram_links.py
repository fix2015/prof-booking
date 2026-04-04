"""Add telegram_links table

Revision ID: 0013
Revises: 0012
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa

revision = "0013"
down_revision = "0012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "telegram_links",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("chat_id", sa.String(64), nullable=False),
        sa.Column("username", sa.String(255), nullable=True),
        sa.Column("linked_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_telegram_links_user_id", "telegram_links", ["user_id"])
    op.create_index("ix_telegram_links_chat_id", "telegram_links", ["chat_id"])


def downgrade() -> None:
    op.drop_index("ix_telegram_links_chat_id", table_name="telegram_links")
    op.drop_index("ix_telegram_links_user_id", table_name="telegram_links")
    op.drop_table("telegram_links")
