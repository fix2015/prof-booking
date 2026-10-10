"""Reshape review_reports for signed-in reporting and moderation (App Store guideline 1.2)

0019 created review_reports for anonymous, IP-keyed reports. Reports now come from signed-in users:
- reporter_user_id FK users (nullable only for the legacy anonymous rows) + unique (review_id, reporter_user_id)
- reason enum spam | inappropriate | harassment | other   (legacy offensive → inappropriate, fake → other)
- details → note
- is_resolved bool → status enum open | resolved (default open)
- reporter_key dropped

Revision ID: 0020
Revises: 0019
"""
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0020"
down_revision = "0019"
branch_labels = None
depends_on = None

reason_enum = postgresql.ENUM("spam", "inappropriate", "harassment", "other", name="review_report_reason", create_type=False)
status_enum = postgresql.ENUM("open", "resolved", name="review_report_status", create_type=False)


def upgrade() -> None:
    bind = op.get_bind()
    reason_enum.create(bind, checkfirst=True)
    status_enum.create(bind, checkfirst=True)

    op.add_column(
        "review_reports",
        sa.Column("reporter_user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=True),
    )
    op.create_index("ix_review_reports_reporter_user_id", "review_reports", ["reporter_user_id"])

    op.alter_column("review_reports", "details", new_column_name="note")

    op.execute(
        "ALTER TABLE review_reports ALTER COLUMN reason TYPE review_report_reason USING ("
        "CASE reason WHEN 'spam' THEN 'spam' WHEN 'offensive' THEN 'inappropriate' "
        "WHEN 'harassment' THEN 'harassment' ELSE 'other' END)::review_report_reason"
    )

    op.add_column(
        "review_reports",
        sa.Column("status", status_enum, nullable=False, server_default="open"),
    )
    op.execute("UPDATE review_reports SET status = 'resolved' WHERE is_resolved")
    op.drop_column("review_reports", "is_resolved")
    op.drop_column("review_reports", "reporter_key")

    op.create_unique_constraint(
        "uq_review_reports_review_reporter", "review_reports", ["review_id", "reporter_user_id"]
    )


def downgrade() -> None:
    op.drop_constraint("uq_review_reports_review_reporter", "review_reports", type_="unique")
    op.add_column("review_reports", sa.Column("reporter_key", sa.String(64), nullable=True))
    op.add_column(
        "review_reports",
        sa.Column("is_resolved", sa.Boolean(), nullable=False, server_default=sa.false()),
    )
    op.execute("UPDATE review_reports SET is_resolved = (status = 'resolved')")
    op.drop_column("review_reports", "status")
    op.execute("ALTER TABLE review_reports ALTER COLUMN reason TYPE VARCHAR(30) USING reason::text")
    op.alter_column("review_reports", "note", new_column_name="details")
    op.drop_index("ix_review_reports_reporter_user_id", table_name="review_reports")
    op.drop_column("review_reports", "reporter_user_id")
    bind = op.get_bind()
    status_enum.drop(bind, checkfirst=True)
    reason_enum.drop(bind, checkfirst=True)
