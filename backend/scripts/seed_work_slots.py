"""
Seed work slots for all active professionals.

Creates Mon–Sat 09:00–18:00 slots for the next 8 weeks,
skipping any dates that already have slots.

Run from project root:
  cd backend && python scripts/seed_work_slots.py

Or with a custom number of weeks:
  cd backend && python scripts/seed_work_slots.py 12
"""
import os
import sys
from datetime import date, timedelta, time

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.environ.setdefault("APP_SECRET_KEY", os.environ.get("APP_SECRET_KEY", "seed"))
os.environ.setdefault("JWT_SECRET_KEY", os.environ.get("JWT_SECRET_KEY", "seed"))

# Import all models so SQLAlchemy resolves every relationship
import app.modules.salons.models       # noqa: F401
import app.modules.masters.models      # noqa: F401
import app.modules.users.models        # noqa: F401
import app.modules.services.models     # noqa: F401
import app.modules.calendar.models     # noqa: F401
import app.modules.sessions.models     # noqa: F401
import app.modules.payments.models     # noqa: F401
import app.modules.invites.models      # noqa: F401
import app.modules.reviews.models      # noqa: F401
import app.modules.invoices.models     # noqa: F401
import app.modules.notifications.models  # noqa: F401
import app.modules.loyalty.models      # noqa: F401

from app.database import SessionLocal
from app.modules.masters.models import ProfessionalProvider, ProfessionalStatus
from app.modules.calendar.models import WorkSlot

WEEKS = int(sys.argv[1]) if len(sys.argv) > 1 else 8
SLOT_START = time(9, 0)
SLOT_END = time(18, 0)
WORK_DAYS = {0, 1, 2, 3, 4, 5}  # Mon–Sat (0=Mon, 6=Sun)


def run() -> None:
    db = SessionLocal()
    try:
        # Get all active professional→provider links
        links = (
            db.query(ProfessionalProvider)
            .filter(ProfessionalProvider.status == ProfessionalStatus.ACTIVE)
            .all()
        )

        if not links:
            print("No active professional–provider links found. Run seed_mock_data.py first.")
            return

        today = date.today()
        end_date = today + timedelta(weeks=WEEKS)

        # Pre-load existing slots to avoid N+1 queries
        existing = set(
            (s.professional_id, s.provider_id, s.slot_date)
            for s in db.query(
                WorkSlot.professional_id, WorkSlot.provider_id, WorkSlot.slot_date
            )
            .filter(WorkSlot.slot_date >= today, WorkSlot.slot_date <= end_date)
            .all()
        )

        created = 0
        skipped = 0
        current = today
        while current <= end_date:
            if current.weekday() in WORK_DAYS:
                for link in links:
                    key = (link.professional_id, link.provider_id, current)
                    if key in existing:
                        skipped += 1
                        continue
                    db.add(WorkSlot(
                        professional_id=link.professional_id,
                        provider_id=link.provider_id,
                        slot_date=current,
                        start_time=SLOT_START,
                        end_time=SLOT_END,
                    ))
                    existing.add(key)
                    created += 1
            current += timedelta(days=1)

        db.commit()
        print(f"Done. Created {created} slots, skipped {skipped} existing. "
              f"({len(links)} professionals, {WEEKS} weeks, Mon–Sat 09:00–18:00)")
    finally:
        db.close()


if __name__ == "__main__":
    run()
