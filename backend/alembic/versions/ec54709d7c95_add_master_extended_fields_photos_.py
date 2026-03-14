"""add_master_extended_fields_photos_reviews_loyalty_invoices

Revision ID: ec54709d7c95
Revises: 0001
Create Date: 2026-03-14 12:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'ec54709d7c95'
down_revision: Union[str, None] = '0001'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # --- masters: new extended profile columns ---
    op.add_column('masters', sa.Column('nationality', sa.String(length=100), nullable=True))
    op.add_column('masters', sa.Column('experience_years', sa.Integer(), nullable=True))
    op.add_column('masters', sa.Column('description', sa.String(length=2000), nullable=True))

    # --- salons: deposit percentage and coordinates ---
    op.add_column('salons', sa.Column('deposit_percentage', sa.Float(), nullable=False, server_default='5.0'))
    op.add_column('salons', sa.Column('latitude', sa.Float(), nullable=True))
    op.add_column('salons', sa.Column('longitude', sa.Float(), nullable=True))

    # --- master_photos ---
    op.create_table(
        'master_photos',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('master_id', sa.Integer(), nullable=False),
        sa.Column('image_url', sa.String(length=512), nullable=False),
        sa.Column('caption', sa.String(length=255), nullable=True),
        sa.Column('order', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['master_id'], ['masters.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_master_photos_id', 'master_photos', ['id'], unique=False)
    op.create_index('ix_master_photos_master', 'master_photos', ['master_id'], unique=False)

    # --- reviews ---
    op.create_table(
        'reviews',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('session_id', sa.Integer(), nullable=True),
        sa.Column('master_id', sa.Integer(), nullable=False),
        sa.Column('salon_id', sa.Integer(), nullable=False),
        sa.Column('client_name', sa.String(length=255), nullable=False),
        sa.Column('client_phone', sa.String(length=30), nullable=True),
        sa.Column('rating', sa.Integer(), nullable=False),
        sa.Column('comment', sa.Text(), nullable=True),
        sa.Column('is_published', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['master_id'], ['masters.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['salon_id'], ['salons.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['session_id'], ['sessions.id'], ondelete='SET NULL'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('session_id'),
    )
    op.create_index('ix_reviews_id', 'reviews', ['id'], unique=False)
    op.create_index('ix_reviews_master', 'reviews', ['master_id'], unique=False)
    op.create_index('ix_reviews_salon', 'reviews', ['salon_id'], unique=False)
    op.create_index('ix_reviews_session', 'reviews', ['session_id'], unique=False)

    # --- loyalty_programs ---
    op.create_table(
        'loyalty_programs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('salon_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['salon_id'], ['salons.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_loyalty_programs_id', 'loyalty_programs', ['id'], unique=False)
    op.create_index('ix_loyalty_programs_salon', 'loyalty_programs', ['salon_id'], unique=False)

    # --- discount_rules ---
    discounttype = sa.Enum('percentage', 'fixed', name='discounttype')
    discounttype.create(op.get_bind(), checkfirst=True)
    op.create_table(
        'discount_rules',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('program_id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('discount_type', discounttype, nullable=False),
        sa.Column('discount_value', sa.Float(), nullable=False),
        sa.Column('conditions', sa.JSON(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['program_id'], ['loyalty_programs.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_discount_rules_id', 'discount_rules', ['id'], unique=False)
    op.create_index('ix_discount_rules_program', 'discount_rules', ['program_id'], unique=False)

    # --- invoices ---
    invoicestatus = sa.Enum('draft', 'sent', 'paid', 'overdue', name='invoicestatus')
    invoicestatus.create(op.get_bind(), checkfirst=True)
    op.create_table(
        'invoices',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('salon_id', sa.Integer(), nullable=False),
        sa.Column('master_id', sa.Integer(), nullable=False),
        sa.Column('period_start', sa.Date(), nullable=False),
        sa.Column('period_end', sa.Date(), nullable=False),
        sa.Column('total_sessions', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('total_revenue', sa.Float(), nullable=False, server_default='0'),
        sa.Column('master_earnings', sa.Float(), nullable=False, server_default='0'),
        sa.Column('salon_earnings', sa.Float(), nullable=False, server_default='0'),
        sa.Column('master_percentage', sa.Float(), nullable=False, server_default='70'),
        sa.Column('status', invoicestatus, nullable=False),
        sa.Column('notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['master_id'], ['masters.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['salon_id'], ['salons.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_invoices_id', 'invoices', ['id'], unique=False)
    op.create_index('ix_invoices_master', 'invoices', ['master_id'], unique=False)
    op.create_index('ix_invoices_period', 'invoices', ['period_start', 'period_end'], unique=False)
    op.create_index('ix_invoices_salon', 'invoices', ['salon_id'], unique=False)

    # --- earnings_splits ---
    op.create_table(
        'earnings_splits',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('salon_id', sa.Integer(), nullable=False),
        sa.Column('master_id', sa.Integer(), nullable=False),
        sa.Column('master_percentage', sa.Float(), nullable=False, server_default='70'),
        sa.Column('effective_from', sa.Date(), nullable=False),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.ForeignKeyConstraint(['master_id'], ['masters.id'], ondelete='CASCADE'),
        sa.ForeignKeyConstraint(['salon_id'], ['salons.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_earnings_splits_id', 'earnings_splits', ['id'], unique=False)
    op.create_index('ix_earnings_splits_salon_master', 'earnings_splits', ['salon_id', 'master_id'], unique=False)


def downgrade() -> None:
    op.drop_table('earnings_splits')
    op.drop_table('invoices')
    op.drop_table('discount_rules')
    op.drop_table('loyalty_programs')
    op.drop_table('reviews')
    op.drop_table('master_photos')
    op.drop_column('salons', 'longitude')
    op.drop_column('salons', 'latitude')
    op.drop_column('salons', 'deposit_percentage')
    op.drop_column('masters', 'description')
    op.drop_column('masters', 'experience_years')
    op.drop_column('masters', 'nationality')
    sa.Enum(name='invoicestatus').drop(op.get_bind(), checkfirst=True)
    sa.Enum(name='discounttype').drop(op.get_bind(), checkfirst=True)
