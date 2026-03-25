"""Make services.provider_id nullable and add professional_id

Revision ID: 0010
Revises: 0009
Create Date: 2026-03-25
"""
from alembic import op
import sqlalchemy as sa

revision = "0010"
down_revision = "0009"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Make provider_id nullable (services can exist without a provider)
    op.alter_column("services", "provider_id", nullable=True)

    # Add professional_id for tracking ownership of personal (no-provider) services
    op.add_column("services", sa.Column(
        "professional_id",
        sa.Integer,
        sa.ForeignKey("professionals.id", ondelete="SET NULL"),
        nullable=True,
    ))
    op.create_index("ix_services_professional", "services", ["professional_id"])


def downgrade() -> None:
    op.drop_index("ix_services_professional", table_name="services")
    op.drop_column("services", "professional_id")
    op.alter_column("services", "provider_id", nullable=False)
