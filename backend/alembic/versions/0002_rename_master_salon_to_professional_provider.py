"""rename master/salon FK columns to professional/provider

Revision ID: 0002
Revises: ec54709d7c95
Create Date: 2026-03-15

The codebase was renamed from salons/masters → providers/professionals
but the initial migration kept the old column names. This migration
renames every salon_id → provider_id and master_id → professional_id
across all affected tables, and re-targets the FK constraints to the
new providers/professionals tables.

Old legacy tables (salons, masters, master_salons, salon_owners) are
left in place but are no longer referenced by application code.
"""
from alembic import op

revision = "0002"
down_revision = "ec54709d7c95"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── sessions ──────────────────────────────────────────────────
    op.drop_constraint("sessions_salon_id_fkey", "sessions", type_="foreignkey")
    op.drop_constraint("sessions_master_id_fkey", "sessions", type_="foreignkey")
    op.alter_column("sessions", "salon_id", new_column_name="provider_id")
    op.alter_column("sessions", "master_id", new_column_name="professional_id")
    op.create_foreign_key(
        "sessions_provider_id_fkey", "sessions", "providers",
        ["provider_id"], ["id"], ondelete="CASCADE",
    )
    op.create_foreign_key(
        "sessions_professional_id_fkey", "sessions", "professionals",
        ["professional_id"], ["id"], ondelete="SET NULL",
    )

    # ── services ──────────────────────────────────────────────────
    op.drop_constraint("services_salon_id_fkey", "services", type_="foreignkey")
    op.alter_column("services", "salon_id", new_column_name="provider_id")
    op.create_foreign_key(
        "services_provider_id_fkey", "services", "providers",
        ["provider_id"], ["id"], ondelete="CASCADE",
    )

    # ── work_slots ────────────────────────────────────────────────
    op.drop_constraint("work_slots_salon_id_fkey", "work_slots", type_="foreignkey")
    op.drop_constraint("work_slots_master_id_fkey", "work_slots", type_="foreignkey")
    op.alter_column("work_slots", "salon_id", new_column_name="provider_id")
    op.alter_column("work_slots", "master_id", new_column_name="professional_id")
    op.create_foreign_key(
        "work_slots_provider_id_fkey", "work_slots", "providers",
        ["provider_id"], ["id"], ondelete="CASCADE",
    )
    op.create_foreign_key(
        "work_slots_professional_id_fkey", "work_slots", "professionals",
        ["professional_id"], ["id"], ondelete="CASCADE",
    )

    # ── reviews ───────────────────────────────────────────────────
    op.drop_constraint("reviews_salon_id_fkey", "reviews", type_="foreignkey")
    op.drop_constraint("reviews_master_id_fkey", "reviews", type_="foreignkey")
    op.alter_column("reviews", "salon_id", new_column_name="provider_id")
    op.alter_column("reviews", "master_id", new_column_name="professional_id")
    op.create_foreign_key(
        "reviews_provider_id_fkey", "reviews", "providers",
        ["provider_id"], ["id"], ondelete="CASCADE",
    )
    op.create_foreign_key(
        "reviews_professional_id_fkey", "reviews", "professionals",
        ["professional_id"], ["id"], ondelete="CASCADE",
    )

    # ── invites ───────────────────────────────────────────────────
    op.drop_constraint("invites_salon_id_fkey", "invites", type_="foreignkey")
    op.alter_column("invites", "salon_id", new_column_name="provider_id")
    op.create_foreign_key(
        "invites_provider_id_fkey", "invites", "providers",
        ["provider_id"], ["id"], ondelete="CASCADE",
    )

    # ── loyalty_programs ──────────────────────────────────────────
    op.drop_constraint("loyalty_programs_salon_id_fkey", "loyalty_programs", type_="foreignkey")
    op.alter_column("loyalty_programs", "salon_id", new_column_name="provider_id")
    op.create_foreign_key(
        "loyalty_programs_provider_id_fkey", "loyalty_programs", "providers",
        ["provider_id"], ["id"], ondelete="CASCADE",
    )

    # ── invoices ──────────────────────────────────────────────────
    op.drop_constraint("invoices_salon_id_fkey", "invoices", type_="foreignkey")
    op.drop_constraint("invoices_master_id_fkey", "invoices", type_="foreignkey")
    op.alter_column("invoices", "salon_id", new_column_name="provider_id")
    op.alter_column("invoices", "master_id", new_column_name="professional_id")
    op.create_foreign_key(
        "invoices_provider_id_fkey", "invoices", "providers",
        ["provider_id"], ["id"], ondelete="CASCADE",
    )
    op.create_foreign_key(
        "invoices_professional_id_fkey", "invoices", "professionals",
        ["professional_id"], ["id"], ondelete="CASCADE",
    )

    # ── earnings_splits ───────────────────────────────────────────
    op.drop_constraint("earnings_splits_salon_id_fkey", "earnings_splits", type_="foreignkey")
    op.drop_constraint("earnings_splits_master_id_fkey", "earnings_splits", type_="foreignkey")
    op.alter_column("earnings_splits", "salon_id", new_column_name="provider_id")
    op.alter_column("earnings_splits", "master_id", new_column_name="professional_id")
    op.create_foreign_key(
        "earnings_splits_provider_id_fkey", "earnings_splits", "providers",
        ["provider_id"], ["id"], ondelete="CASCADE",
    )
    op.create_foreign_key(
        "earnings_splits_professional_id_fkey", "earnings_splits", "professionals",
        ["professional_id"], ["id"], ondelete="CASCADE",
    )

    # ── Drop stale master_photos table (replaced by professional_photos) ──
    op.drop_table("master_photos")


def downgrade() -> None:
    import sqlalchemy as sa

    # Recreate master_photos
    op.create_table(
        "master_photos",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("master_id", sa.Integer(), nullable=False),
        sa.Column("image_url", sa.String(length=512), nullable=False),
        sa.Column("caption", sa.String(length=255), nullable=True),
        sa.Column("order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(["master_id"], ["masters.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )

    # earnings_splits
    op.drop_constraint("earnings_splits_professional_id_fkey", "earnings_splits", type_="foreignkey")
    op.drop_constraint("earnings_splits_provider_id_fkey", "earnings_splits", type_="foreignkey")
    op.alter_column("earnings_splits", "provider_id", new_column_name="salon_id")
    op.alter_column("earnings_splits", "professional_id", new_column_name="master_id")
    op.create_foreign_key("earnings_splits_salon_id_fkey", "earnings_splits", "salons", ["salon_id"], ["id"], ondelete="CASCADE")
    op.create_foreign_key("earnings_splits_master_id_fkey", "earnings_splits", "masters", ["master_id"], ["id"], ondelete="CASCADE")

    # invoices
    op.drop_constraint("invoices_professional_id_fkey", "invoices", type_="foreignkey")
    op.drop_constraint("invoices_provider_id_fkey", "invoices", type_="foreignkey")
    op.alter_column("invoices", "provider_id", new_column_name="salon_id")
    op.alter_column("invoices", "professional_id", new_column_name="master_id")
    op.create_foreign_key("invoices_salon_id_fkey", "invoices", "salons", ["salon_id"], ["id"], ondelete="CASCADE")
    op.create_foreign_key("invoices_master_id_fkey", "invoices", "masters", ["master_id"], ["id"], ondelete="CASCADE")

    # loyalty_programs
    op.drop_constraint("loyalty_programs_provider_id_fkey", "loyalty_programs", type_="foreignkey")
    op.alter_column("loyalty_programs", "provider_id", new_column_name="salon_id")
    op.create_foreign_key("loyalty_programs_salon_id_fkey", "loyalty_programs", "salons", ["salon_id"], ["id"], ondelete="CASCADE")

    # invites
    op.drop_constraint("invites_provider_id_fkey", "invites", type_="foreignkey")
    op.alter_column("invites", "provider_id", new_column_name="salon_id")
    op.create_foreign_key("invites_salon_id_fkey", "invites", "salons", ["salon_id"], ["id"], ondelete="CASCADE")

    # reviews
    op.drop_constraint("reviews_professional_id_fkey", "reviews", type_="foreignkey")
    op.drop_constraint("reviews_provider_id_fkey", "reviews", type_="foreignkey")
    op.alter_column("reviews", "provider_id", new_column_name="salon_id")
    op.alter_column("reviews", "professional_id", new_column_name="master_id")
    op.create_foreign_key("reviews_salon_id_fkey", "reviews", "salons", ["salon_id"], ["id"], ondelete="CASCADE")
    op.create_foreign_key("reviews_master_id_fkey", "reviews", "masters", ["master_id"], ["id"], ondelete="CASCADE")

    # work_slots
    op.drop_constraint("work_slots_professional_id_fkey", "work_slots", type_="foreignkey")
    op.drop_constraint("work_slots_provider_id_fkey", "work_slots", type_="foreignkey")
    op.alter_column("work_slots", "provider_id", new_column_name="salon_id")
    op.alter_column("work_slots", "professional_id", new_column_name="master_id")
    op.create_foreign_key("work_slots_salon_id_fkey", "work_slots", "salons", ["salon_id"], ["id"], ondelete="CASCADE")
    op.create_foreign_key("work_slots_master_id_fkey", "work_slots", "masters", ["master_id"], ["id"], ondelete="CASCADE")

    # services
    op.drop_constraint("services_provider_id_fkey", "services", type_="foreignkey")
    op.alter_column("services", "provider_id", new_column_name="salon_id")
    op.create_foreign_key("services_salon_id_fkey", "services", "salons", ["salon_id"], ["id"], ondelete="CASCADE")

    # sessions
    op.drop_constraint("sessions_professional_id_fkey", "sessions", type_="foreignkey")
    op.drop_constraint("sessions_provider_id_fkey", "sessions", type_="foreignkey")
    op.alter_column("sessions", "provider_id", new_column_name="salon_id")
    op.alter_column("sessions", "professional_id", new_column_name="master_id")
    op.create_foreign_key("sessions_salon_id_fkey", "sessions", "salons", ["salon_id"], ["id"], ondelete="CASCADE")
    op.create_foreign_key("sessions_master_id_fkey", "sessions", "masters", ["master_id"], ["id"], ondelete="SET NULL")
