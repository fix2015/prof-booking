import os
import sys
from logging.config import fileConfig
from sqlalchemy import engine_from_config, pool
from alembic import context

# Ensure app is importable
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.config import settings
from app.database import Base

# Import all models so Alembic can detect them
from app.modules.users.models import User, RefreshToken
from app.modules.salons.models import Salon, SalonOwner
from app.modules.masters.models import Master, MasterSalon, MasterPhoto
from app.modules.services.models import Service
from app.modules.sessions.models import Session
from app.modules.calendar.models import WorkSlot
from app.modules.payments.models import Payment
from app.modules.notifications.models import Notification
from app.modules.invites.models import Invite
from app.modules.reviews.models import Review
from app.modules.loyalty.models import LoyaltyProgram, DiscountRule
from app.modules.invoices.models import Invoice, EarningsSplit

config = context.config
config.set_main_option("sqlalchemy.url", settings.DATABASE_URL)

if config.config_file_name is not None:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def run_migrations_offline() -> None:
    url = config.get_main_option("sqlalchemy.url")
    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        dialect_opts={"paramstyle": "named"},
    )
    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    connectable = engine_from_config(
        config.get_section(config.config_ini_section, {}),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )
    with connectable.connect() as connection:
        context.configure(connection=connection, target_metadata=target_metadata)
        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
