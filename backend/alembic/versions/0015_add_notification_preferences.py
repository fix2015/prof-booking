"""Add notification_preferences table

Revision ID: 0015
Revises: 0014
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa

revision = "0015"
down_revision = "0014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "notification_preferences",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False),
        sa.Column("daily_morning", sa.Integer(), server_default="1", nullable=False),
        sa.Column("weekly_schedule", sa.Integer(), server_default="0", nullable=False),
        sa.Column("eod_recap", sa.Integer(), server_default="1", nullable=False),
        sa.Column("cancellation", sa.Integer(), server_default="1", nullable=False),
        sa.Column("new_review", sa.Integer(), server_default="0", nullable=False),
        sa.Column("appointment_reminder", sa.Integer(), server_default="1", nullable=False),
    )


def downgrade() -> None:
    op.drop_table("notification_preferences")
