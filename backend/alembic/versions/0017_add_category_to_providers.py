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
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns
                WHERE table_name = 'providers' AND column_name = 'category'
            ) THEN
                ALTER TABLE providers ADD COLUMN category VARCHAR(100);
            END IF;
        END $$;
    """)


def downgrade() -> None:
    op.drop_column("providers", "category")
