"""Add client CRM tables (client_profiles, client_notes, client_photos)

Revision ID: 0009
Revises: 0008
Create Date: 2026-03-25
"""
from alembic import op
import sqlalchemy as sa

revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "client_profiles",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("phone", sa.String(30), nullable=False, unique=True),
        sa.Column("name", sa.String(255), nullable=False),
        sa.Column("email", sa.String(255), nullable=True),
        sa.Column("birth_date", sa.Date, nullable=True),
        sa.Column("avatar_url", sa.String(512), nullable=True),
        sa.Column("tags", sa.JSON, nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, nullable=True),
    )
    op.create_index("ix_client_profiles_phone", "client_profiles", ["phone"], unique=True)

    op.create_table(
        "client_notes",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("client_id", sa.Integer, sa.ForeignKey("client_profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("professional_id", sa.Integer, sa.ForeignKey("professionals.id", ondelete="CASCADE"), nullable=False),
        sa.Column("provider_id", sa.Integer, sa.ForeignKey("providers.id", ondelete="SET NULL"), nullable=True),
        sa.Column("title", sa.String(255), nullable=False),
        sa.Column("content", sa.Text, nullable=False),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime, nullable=True),
    )
    op.create_index("ix_client_notes_client", "client_notes", ["client_id"])
    op.create_index("ix_client_notes_professional", "client_notes", ["professional_id"])
    op.create_index("ix_client_notes_provider", "client_notes", ["provider_id"])

    op.create_table(
        "client_photos",
        sa.Column("id", sa.Integer, primary_key=True, index=True),
        sa.Column("client_id", sa.Integer, sa.ForeignKey("client_profiles.id", ondelete="CASCADE"), nullable=False),
        sa.Column("professional_id", sa.Integer, sa.ForeignKey("professionals.id", ondelete="CASCADE"), nullable=False),
        sa.Column("provider_id", sa.Integer, sa.ForeignKey("providers.id", ondelete="SET NULL"), nullable=True),
        sa.Column("url", sa.String(512), nullable=False),
        sa.Column("caption", sa.String(255), nullable=True),
        sa.Column("created_at", sa.DateTime, nullable=False, server_default=sa.func.now()),
    )
    op.create_index("ix_client_photos_client", "client_photos", ["client_id"])
    op.create_index("ix_client_photos_professional", "client_photos", ["professional_id"])
    op.create_index("ix_client_photos_provider", "client_photos", ["provider_id"])


def downgrade() -> None:
    op.drop_table("client_photos")
    op.drop_table("client_notes")
    op.drop_table("client_profiles")
