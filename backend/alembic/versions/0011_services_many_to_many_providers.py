"""Services many-to-many providers — replace provider_id with service_providers table

Revision ID: 0011
Revises: 0010
Create Date: 2026-03-25
"""
from alembic import op
import sqlalchemy as sa

revision = "0011"
down_revision = "0010"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create junction table
    op.create_table(
        "service_providers",
        sa.Column("service_id", sa.Integer, sa.ForeignKey("services.id", ondelete="CASCADE"), primary_key=True),
        sa.Column("provider_id", sa.Integer, sa.ForeignKey("providers.id", ondelete="CASCADE"), primary_key=True),
    )
    op.create_index("ix_service_providers_provider", "service_providers", ["provider_id"])

    # Migrate existing data
    op.execute(
        "INSERT INTO service_providers (service_id, provider_id) "
        "SELECT id, provider_id FROM services WHERE provider_id IS NOT NULL"
    )

    # Drop old column
    op.drop_index("ix_services_provider", table_name="services")
    op.drop_column("services", "provider_id")


def downgrade() -> None:
    op.add_column("services", sa.Column("provider_id", sa.Integer, nullable=True))
    op.create_index("ix_services_provider", "services", ["provider_id"])
    # Restore first provider per service (best effort)
    op.execute(
        "UPDATE services SET provider_id = ("
        "  SELECT provider_id FROM service_providers WHERE service_id = services.id LIMIT 1"
        ")"
    )
    op.drop_index("ix_service_providers_provider", table_name="service_providers")
    op.drop_table("service_providers")
