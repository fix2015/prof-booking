"""Add push_subscriptions table for Web Push notifications

Revision ID: 0014
Revises: 0013
Create Date: 2026-04-04
"""
from alembic import op
import sqlalchemy as sa

revision = "0014"
down_revision = "0013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "push_subscriptions",
        sa.Column("id", sa.Integer(), primary_key=True, autoincrement=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("endpoint", sa.Text(), nullable=False),
        sa.Column("p256dh", sa.String(255), nullable=False),
        sa.Column("auth", sa.String(255), nullable=False),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_push_sub_user", "push_subscriptions", ["user_id"])
    op.create_index("ix_push_sub_endpoint", "push_subscriptions", ["endpoint"], unique=True)

    # Convert notification_type from varchar to enum if needed, ensure web_push exists
    op.execute("""
        DO $$
        BEGIN
            -- Create notificationtype enum if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notificationtype') THEN
                CREATE TYPE notificationtype AS ENUM (
                    'sms_confirmation', 'sms_reminder',
                    'email_confirmation', 'email_reminder',
                    'telegram', 'web_push'
                );
                ALTER TABLE notifications
                    ALTER COLUMN notification_type TYPE notificationtype
                    USING notification_type::notificationtype;
            END IF;

            -- Create notificationstatus enum if it doesn't exist
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'notificationstatus') THEN
                CREATE TYPE notificationstatus AS ENUM ('pending', 'sent', 'failed');
                ALTER TABLE notifications ALTER COLUMN status DROP DEFAULT;
                ALTER TABLE notifications
                    ALTER COLUMN status TYPE notificationstatus
                    USING status::notificationstatus;
                ALTER TABLE notifications ALTER COLUMN status SET DEFAULT 'pending'::notificationstatus;
            END IF;
        END
        $$;
    """)
    # ADD VALUE cannot run inside a transaction block in older PG,
    # but with IF NOT EXISTS it's safe on PG 12+.
    op.execute("ALTER TYPE notificationtype ADD VALUE IF NOT EXISTS 'web_push'")


def downgrade() -> None:
    op.drop_index("ix_push_sub_endpoint", table_name="push_subscriptions")
    op.drop_index("ix_push_sub_user", table_name="push_subscriptions")
    op.drop_table("push_subscriptions")
