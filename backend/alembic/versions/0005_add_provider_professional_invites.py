"""add provider_professional_invites table

Revision ID: 0005
Revises: 0004
Create Date: 2026-03-17

"""
import sqlalchemy as sa
from alembic import op

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "provider_professional_invites",
        sa.Column("id", sa.Integer(), primary_key=True, index=True),
        sa.Column("provider_id", sa.Integer(), sa.ForeignKey("providers.id", ondelete="CASCADE"), nullable=False),
        sa.Column("professional_id", sa.Integer(), sa.ForeignKey("professionals.id", ondelete="CASCADE"), nullable=False),
        sa.Column(
            "status",
            sa.Enum("pending", "accepted", "rejected", name="directinvitestatus"),
            nullable=False,
            server_default="pending",
        ),
        sa.Column("message", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.func.now()),
        sa.Column("responded_at", sa.DateTime(), nullable=True),
    )
    op.create_index("ix_ppi_professional", "provider_professional_invites", ["professional_id"])
    op.create_index("ix_ppi_provider", "provider_professional_invites", ["provider_id"])


def downgrade() -> None:
    op.drop_index("ix_ppi_professional", table_name="provider_professional_invites")
    op.drop_index("ix_ppi_provider", table_name="provider_professional_invites")
    op.drop_table("provider_professional_invites")
    op.execute("DROP TYPE IF EXISTS directinvitestatus")
