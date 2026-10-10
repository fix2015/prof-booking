"""Make notification enum labels match the code (upper-case member names)

Revision ID: 0022
Revises: 0021

Migration 0014 creates ``notificationtype`` / ``notificationstatus`` with lower-case
labels and converts the notifications columns to them when the types don't exist yet
(i.e. on a freshly created database). SQLAlchemy's ``Enum(NotificationType)`` stores the
member *names* (``SMS_CONFIRMATION``, ``PENDING``), so every notification insert -- and
with it public booking -- failed on a fresh ``alembic upgrade head``.

This migration is idempotent and deliberately narrow: it only touches a type whose
notifications column actually uses it, and only renames labels that are still
lower-case. On databases where the columns are plain varchar (production) it does
nothing at all.
"""
from alembic import op

revision = "0022"
down_revision = "0021"
branch_labels = None
depends_on = None

_TYPES = {
    "notificationtype": (
        "notification_type",
        ["SMS_CONFIRMATION", "SMS_REMINDER", "EMAIL_CONFIRMATION", "EMAIL_REMINDER", "TELEGRAM", "WEB_PUSH"],
    ),
    "notificationstatus": ("status", ["PENDING", "SENT", "FAILED"]),
}


def upgrade() -> None:
    for type_name, (column, labels) in _TYPES.items():
        values = ", ".join(f"'{label}'" for label in labels)
        op.execute(f"""
            DO $$
            DECLARE
                lbl text;
            BEGIN
                IF NOT EXISTS (
                    SELECT 1 FROM information_schema.columns
                    WHERE table_schema = current_schema() AND table_name = 'notifications'
                      AND column_name = '{column}' AND udt_name = '{type_name}'
                ) THEN
                    RETURN;  -- column isn't using the enum (e.g. varchar): nothing to fix
                END IF;
                FOREACH lbl IN ARRAY ARRAY[{values}] LOOP
                    IF EXISTS (
                        SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
                        WHERE t.typname = '{type_name}' AND e.enumlabel = lower(lbl)
                    ) AND NOT EXISTS (
                        SELECT 1 FROM pg_enum e JOIN pg_type t ON t.oid = e.enumtypid
                        WHERE t.typname = '{type_name}' AND e.enumlabel = lbl
                    ) THEN
                        EXECUTE format('ALTER TYPE {type_name} RENAME VALUE %L TO %L', lower(lbl), lbl);
                    END IF;
                END LOOP;
            END
            $$;
        """)


def downgrade() -> None:
    # Renaming back would re-break notification inserts; nothing to undo.
    pass
