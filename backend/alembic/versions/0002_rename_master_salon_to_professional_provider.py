"""rename master/salon FK columns to professional/provider

Revision ID: 0002
Revises: ec54709d7c95
Create Date: 2026-03-15

The codebase was renamed from salons/masters → providers/professionals
but the initial migration kept the old column names. This migration
renames every salon_id → provider_id and master_id → professional_id
across all affected tables, and re-targets the FK constraints to the
new providers/professionals tables.

Tables are renamed: salons→providers, masters→professionals,
salon_owners→provider_owners, master_salons→professional_providers,
master_photos→professional_photos.
"""
from alembic import op

revision = "0002"
down_revision = "ec54709d7c95"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ── Rename tables first ───────────────────────────────────────
    op.rename_table("salons", "providers")
    op.rename_table("masters", "professionals")
    op.rename_table("salon_owners", "provider_owners")
    op.rename_table("master_salons", "professional_providers")

    # ── Rename FK columns inside renamed junction tables ──────────
    op.drop_constraint("salon_owners_salon_id_fkey", "provider_owners", type_="foreignkey")
    op.alter_column("provider_owners", "salon_id", new_column_name="provider_id")
    op.create_foreign_key(
        "provider_owners_provider_id_fkey", "provider_owners", "providers",
        ["provider_id"], ["id"], ondelete="CASCADE",
    )

    op.drop_constraint("master_salons_master_id_fkey", "professional_providers", type_="foreignkey")
    op.drop_constraint("master_salons_salon_id_fkey", "professional_providers", type_="foreignkey")
    op.alter_column("professional_providers", "master_id", new_column_name="professional_id")
    op.alter_column("professional_providers", "salon_id", new_column_name="provider_id")
    op.create_foreign_key(
        "professional_providers_professional_id_fkey", "professional_providers", "professionals",
        ["professional_id"], ["id"], ondelete="CASCADE",
    )
    op.create_foreign_key(
        "professional_providers_provider_id_fkey", "professional_providers", "providers",
        ["provider_id"], ["id"], ondelete="CASCADE",
    )

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

    # ── Rename master_photos → professional_photos ─────────────────
    op.rename_table("master_photos", "professional_photos")
    op.drop_constraint("master_photos_master_id_fkey", "professional_photos", type_="foreignkey")
    op.alter_column("professional_photos", "master_id", new_column_name="professional_id")
    op.create_foreign_key(
        "professional_photos_professional_id_fkey", "professional_photos", "professionals",
        ["professional_id"], ["id"], ondelete="CASCADE",
    )
    # Update indexes
    op.drop_index("ix_master_photos_id", table_name="professional_photos")
    op.drop_index("ix_master_photos_master", table_name="professional_photos")
    op.create_index("ix_professional_photos_id", "professional_photos", ["id"], unique=False)
    op.create_index("ix_professional_photos_professional", "professional_photos", ["professional_id"], unique=False)


def downgrade() -> None:
    # Reverse professional_photos → master_photos
    op.drop_index("ix_professional_photos_professional", table_name="professional_photos")
    op.drop_index("ix_professional_photos_id", table_name="professional_photos")
    op.drop_constraint("professional_photos_professional_id_fkey", "professional_photos", type_="foreignkey")
    op.alter_column("professional_photos", "professional_id", new_column_name="master_id")
    op.rename_table("professional_photos", "master_photos")
    op.create_foreign_key("master_photos_master_id_fkey", "master_photos", "professionals", ["master_id"], ["id"], ondelete="CASCADE")
    op.create_index("ix_master_photos_id", "master_photos", ["id"], unique=False)
    op.create_index("ix_master_photos_master", "master_photos", ["master_id"], unique=False)

    # earnings_splits (tables are still named providers/professionals until the end)
    op.drop_constraint("earnings_splits_professional_id_fkey", "earnings_splits", type_="foreignkey")
    op.drop_constraint("earnings_splits_provider_id_fkey", "earnings_splits", type_="foreignkey")
    op.alter_column("earnings_splits", "provider_id", new_column_name="salon_id")
    op.alter_column("earnings_splits", "professional_id", new_column_name="master_id")
    op.create_foreign_key("earnings_splits_salon_id_fkey", "earnings_splits", "providers", ["salon_id"], ["id"], ondelete="CASCADE")
    op.create_foreign_key("earnings_splits_master_id_fkey", "earnings_splits", "professionals", ["master_id"], ["id"], ondelete="CASCADE")

    # invoices
    op.drop_constraint("invoices_professional_id_fkey", "invoices", type_="foreignkey")
    op.drop_constraint("invoices_provider_id_fkey", "invoices", type_="foreignkey")
    op.alter_column("invoices", "provider_id", new_column_name="salon_id")
    op.alter_column("invoices", "professional_id", new_column_name="master_id")
    op.create_foreign_key("invoices_salon_id_fkey", "invoices", "providers", ["salon_id"], ["id"], ondelete="CASCADE")
    op.create_foreign_key("invoices_master_id_fkey", "invoices", "professionals", ["master_id"], ["id"], ondelete="CASCADE")

    # loyalty_programs
    op.drop_constraint("loyalty_programs_provider_id_fkey", "loyalty_programs", type_="foreignkey")
    op.alter_column("loyalty_programs", "provider_id", new_column_name="salon_id")
    op.create_foreign_key("loyalty_programs_salon_id_fkey", "loyalty_programs", "providers", ["salon_id"], ["id"], ondelete="CASCADE")

    # invites
    op.drop_constraint("invites_provider_id_fkey", "invites", type_="foreignkey")
    op.alter_column("invites", "provider_id", new_column_name="salon_id")
    op.create_foreign_key("invites_salon_id_fkey", "invites", "providers", ["salon_id"], ["id"], ondelete="CASCADE")

    # reviews
    op.drop_constraint("reviews_professional_id_fkey", "reviews", type_="foreignkey")
    op.drop_constraint("reviews_provider_id_fkey", "reviews", type_="foreignkey")
    op.alter_column("reviews", "provider_id", new_column_name="salon_id")
    op.alter_column("reviews", "professional_id", new_column_name="master_id")
    op.create_foreign_key("reviews_salon_id_fkey", "reviews", "providers", ["salon_id"], ["id"], ondelete="CASCADE")
    op.create_foreign_key("reviews_master_id_fkey", "reviews", "professionals", ["master_id"], ["id"], ondelete="CASCADE")

    # work_slots
    op.drop_constraint("work_slots_professional_id_fkey", "work_slots", type_="foreignkey")
    op.drop_constraint("work_slots_provider_id_fkey", "work_slots", type_="foreignkey")
    op.alter_column("work_slots", "provider_id", new_column_name="salon_id")
    op.alter_column("work_slots", "professional_id", new_column_name="master_id")
    op.create_foreign_key("work_slots_salon_id_fkey", "work_slots", "providers", ["salon_id"], ["id"], ondelete="CASCADE")
    op.create_foreign_key("work_slots_master_id_fkey", "work_slots", "professionals", ["master_id"], ["id"], ondelete="CASCADE")

    # services
    op.drop_constraint("services_provider_id_fkey", "services", type_="foreignkey")
    op.alter_column("services", "provider_id", new_column_name="salon_id")
    op.create_foreign_key("services_salon_id_fkey", "services", "providers", ["salon_id"], ["id"], ondelete="CASCADE")

    # sessions
    op.drop_constraint("sessions_professional_id_fkey", "sessions", type_="foreignkey")
    op.drop_constraint("sessions_provider_id_fkey", "sessions", type_="foreignkey")
    op.alter_column("sessions", "provider_id", new_column_name="salon_id")
    op.alter_column("sessions", "professional_id", new_column_name="master_id")
    op.create_foreign_key("sessions_salon_id_fkey", "sessions", "providers", ["salon_id"], ["id"], ondelete="CASCADE")
    op.create_foreign_key("sessions_master_id_fkey", "sessions", "professionals", ["master_id"], ["id"], ondelete="SET NULL")

    # Reverse junction table column renames
    op.drop_constraint("professional_providers_professional_id_fkey", "professional_providers", type_="foreignkey")
    op.drop_constraint("professional_providers_provider_id_fkey", "professional_providers", type_="foreignkey")
    op.alter_column("professional_providers", "professional_id", new_column_name="master_id")
    op.alter_column("professional_providers", "provider_id", new_column_name="salon_id")
    op.create_foreign_key("master_salons_master_id_fkey", "professional_providers", "professionals", ["master_id"], ["id"], ondelete="CASCADE")
    op.create_foreign_key("master_salons_salon_id_fkey", "professional_providers", "providers", ["salon_id"], ["id"], ondelete="CASCADE")

    op.drop_constraint("provider_owners_provider_id_fkey", "provider_owners", type_="foreignkey")
    op.alter_column("provider_owners", "provider_id", new_column_name="salon_id")
    op.create_foreign_key("salon_owners_salon_id_fkey", "provider_owners", "providers", ["salon_id"], ["id"], ondelete="CASCADE")

    # Reverse table renames (must be last)
    op.rename_table("professional_providers", "master_salons")
    op.rename_table("provider_owners", "salon_owners")
    op.rename_table("professionals", "masters")
    op.rename_table("providers", "salons")
