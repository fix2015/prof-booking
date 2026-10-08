"""Add review_reports (report objectionable reviews — App Store guideline 1.2)

Revision ID: 0019
Revises: 0018
"""
import sqlalchemy as sa

from alembic import op

revision = "0019"
down_revision = "0018"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "review_reports",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("review_id", sa.Integer(), sa.ForeignKey("reviews.id", ondelete="CASCADE"), nullable=False),
        sa.Column("reason", sa.String(30), nullable=False),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column("reporter_key", sa.String(64), nullable=True),
        sa.Column("is_resolved", sa.Boolean(), nullable=False, server_default=sa.false()),
        sa.Column("created_at", sa.DateTime(), nullable=False),
    )
    op.create_index("ix_review_reports_id", "review_reports", ["id"])
    op.create_index("ix_review_reports_review_id", "review_reports", ["review_id"])


def downgrade() -> None:
    op.drop_index("ix_review_reports_review_id", table_name="review_reports")
    op.drop_index("ix_review_reports_id", table_name="review_reports")
    op.drop_table("review_reports")
