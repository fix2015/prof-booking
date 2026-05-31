"""
Import scraped UK businesses into prof-booking database.
=========================================================
Reads the JSON output from scrape_uk_businesses.py and creates:
  - Provider records (with logo uploaded or linked)
  - Default services per provider (from our standard service list)
  - Work slots (optional)

Prerequisites:
  - Database must be running and migrations applied
  - Run from backend/ directory so app modules can be imported

Usage:
    cd backend

    # Dry run — shows what would be imported without touching the DB
    python scripts/scraper/import_to_db.py --dry-run

    # Import all scraped businesses
    python scripts/scraper/import_to_db.py

    # Import and also create default services for each provider
    python scripts/scraper/import_to_db.py --with-services

    # Limit import count (useful for testing)
    python scripts/scraper/import_to_db.py --limit 10

    # Use a specific JSON file
    python scripts/scraper/import_to_db.py --input path/to/scraped.json
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", ".."))
os.environ.setdefault("APP_SECRET_KEY", os.environ.get("APP_SECRET_KEY", "import-script"))
os.environ.setdefault("JWT_SECRET_KEY", os.environ.get("JWT_SECRET_KEY", "import-script"))

from app.database import SessionLocal
from app.modules.salons.models import Provider
from app.modules.services.models import Service

DEFAULT_INPUT = Path(__file__).parent / "output" / "scraped_businesses.json"

# Tag to identify imported records (for easy cleanup)
IMPORT_TAG = "scraped-uk-import"

# Default services we create for each imported provider
DEFAULT_SERVICES = [
    ("Gel Manicure",            45,  35.00),
    ("Acrylic Full Set",        90,  55.00),
    ("Gel Pedicure",            50,  40.00),
    ("Nail Art Design",         60,  45.00),
    ("Dip Powder Manicure",     45,  38.00),
    ("French Manicure",         40,  30.00),
    ("Shellac Manicure",        35,  28.00),
    ("Nail Extensions",         75,  50.00),
    ("Classic Manicure",        30,  22.00),
    ("Classic Pedicure",        40,  28.00),
    ("Nail Removal",            20,  15.00),
    ("Nail Repair",             20,  12.00),
    ("Infill Acrylic",          60,  40.00),
    ("Chrome Powder Nails",     50,  42.00),
    ("Ombre Nails",             60,  48.00),
    ("Builder Gel Overlay",     50,  38.00),
    ("Cuticle Care Treatment",  25,  18.00),
    ("3D Nail Art",             75,  55.00),
    ("Luxury Manicure & Spa",   60,  50.00),
    ("Polygel Application",     70,  52.00),
    ("Hard Gel Nails",          65,  45.00),
    ("Russian Manicure",        50,  35.00),
    ("Nail Stamping Art",       45,  32.00),
    ("Encapsulated Nail Art",   70,  58.00),
    ("Paraffin Wax Treatment",  30,  25.00),
]


def load_scraped_data(input_path: Path) -> list[dict]:
    """Load and return the list of scraped businesses."""
    if not input_path.exists():
        print(f"ERROR: Input file not found: {input_path}")
        print("  Run scrape_uk_businesses.py first.")
        sys.exit(1)

    with open(input_path, encoding="utf-8") as f:
        data = json.load(f)

    businesses = data.get("businesses", [])
    print(f"Loaded {len(businesses)} businesses from {input_path}")
    print(f"  Scraped at: {data.get('scraped_at', 'unknown')}")
    return businesses


def filter_businesses(
    businesses: list[dict],
    require_address: bool = False,
    require_phone: bool = False,
) -> list[dict]:
    """Filter businesses by data quality."""
    filtered = []
    for b in businesses:
        if not b.get("name"):
            continue
        if require_address and not b.get("address"):
            continue
        if require_phone and not b.get("phone"):
            continue
        filtered.append(b)
    return filtered


def resolve_logo_url(business: dict) -> str | None:
    """Get the logo URL. For scraped data, use the first photo path
    or a placeholder based on the business name."""
    # If photos were downloaded locally, they'd need to be uploaded to S3/storage
    # For now, generate a deterministic placeholder that can be replaced later
    photo_paths = business.get("photo_paths", [])
    if photo_paths:
        # Store the local path — the upload step handles pushing to S3
        return f"local:{photo_paths[0]}"

    # Fallback: generate a placeholder
    slug = business["name"].lower().replace(" ", "").replace("&", "")[:20]
    return f"https://picsum.photos/seed/{slug}/200/200"


def get_existing_source_ids(db) -> set[str]:
    """Get osm_ids already in the database to avoid duplicates.
    We store the osm_id in the provider's settings JSON."""
    from sqlalchemy import text
    try:
        rows = db.execute(text(
            "SELECT settings->>'osm_id' FROM providers "
            "WHERE settings->>'osm_id' IS NOT NULL"
        )).fetchall()
        return {row[0] for row in rows if row[0]}
    except Exception:
        # settings column might not support JSON queries on SQLite
        return set()


def import_businesses(
    businesses: list[dict],
    with_services: bool = False,
    dry_run: bool = False,
) -> dict:
    """Import businesses into the database. Returns stats dict."""
    stats = {"created": 0, "skipped_duplicate": 0, "skipped_error": 0, "services_created": 0}

    if dry_run:
        print("\n--- DRY RUN (no database changes) ---\n")
        for i, b in enumerate(businesses, 1):
            rating_str = f" ({b.get('rating', '?')}* / {b.get('total_reviews', 0)} reviews)" if b.get('rating') else ""
            print(f"  {i:3d}. {b['name']}")
            print(f"       {b.get('address', 'No address')}{rating_str}")
            print(f"       Phone: {b.get('phone', '-')} | Email: {b.get('email', '-')}")
            print(f"       Category: {b.get('category', '-')} | Photos: {len(b.get('photo_paths', []))}")
        stats["created"] = len(businesses)
        return stats

    db = SessionLocal()
    try:
        existing_ids = get_existing_source_ids(db)

        for i, b in enumerate(businesses, 1):
            source_id = b.get("osm_id", "")

            # Skip duplicates
            if source_id and source_id in existing_ids:
                print(f"  [{i}] SKIP (duplicate): {b['name']}")
                stats["skipped_duplicate"] += 1
                continue

            try:
                logo_url = resolve_logo_url(b)

                provider = Provider(
                    name=b["name"],
                    address=b.get("address"),
                    phone=b.get("phone"),
                    email=b.get("email"),
                    description=b.get("description", ""),
                    logo_url=logo_url,
                    category=b.get("category", "Beauty & Nails"),
                    latitude=b.get("latitude"),
                    longitude=b.get("longitude"),
                    is_active=True,
                    worker_payment_amount=0.0,
                    deposit_percentage=10.0,
                    settings={
                        "osm_id": source_id,
                        "import_source": IMPORT_TAG,
                        "source": b.get("source", "openstreetmap"),
                        "website": b.get("website", ""),
                        "opening_hours": b.get("opening_hours", []),
                        "photo_paths": b.get("photo_paths", []),
                    },
                )
                db.add(provider)
                db.flush()  # Get provider.id

                # Create default services
                if with_services:
                    for svc_name, duration, price in DEFAULT_SERVICES:
                        db.add(Service(
                            provider_id=provider.id,
                            name=svc_name,
                            duration_minutes=duration,
                            price=price,
                            is_active=True,
                            created_at=datetime.utcnow(),
                        ))
                    stats["services_created"] += len(DEFAULT_SERVICES)

                existing_ids.add(source_id)
                stats["created"] += 1
                print(f"  [{i}] CREATED: {b['name']} (id={provider.id})")

            except Exception as e:
                print(f"  [{i}] ERROR: {b['name']} - {e}")
                stats["skipped_error"] += 1
                db.rollback()
                continue

        db.commit()
        print("\nDatabase commit successful.")

    except Exception as e:
        db.rollback()
        print(f"\nFATAL: {e}")
        raise
    finally:
        db.close()

    return stats


def cleanup_imported(dry_run: bool = False) -> int:
    """Remove all previously imported scraped businesses."""
    db = SessionLocal()
    try:
        from sqlalchemy import text

        # Find providers imported by this script
        rows = db.execute(text(
            f"SELECT id, name FROM providers WHERE settings->>'import_source' = :tag"
        ), {"tag": IMPORT_TAG}).fetchall()

        if not rows:
            print("No imported businesses found to clean up.")
            return 0

        print(f"Found {len(rows)} imported businesses to remove:")
        for row in rows:
            print(f"  - [{row[0]}] {row[1]}")

        if dry_run:
            print("\n(Dry run — no changes made)")
            return len(rows)

        ids = [row[0] for row in rows]
        placeholders = ",".join(str(i) for i in ids)

        # Delete in correct FK order
        db.execute(text(f"DELETE FROM services WHERE provider_id IN ({placeholders})"))
        db.execute(text(f"DELETE FROM providers WHERE id IN ({placeholders})"))
        db.commit()
        print(f"\nRemoved {len(rows)} providers and their services.")
        return len(rows)

    finally:
        db.close()


def main():
    parser = argparse.ArgumentParser(description="Import scraped businesses into prof-booking DB")
    parser.add_argument("--input", type=str, default=str(DEFAULT_INPUT), help="Path to scraped JSON")
    parser.add_argument("--dry-run", action="store_true", help="Preview without importing")
    parser.add_argument("--require-address", action="store_true", help="Only import businesses with an address")
    parser.add_argument("--require-phone", action="store_true", help="Only import businesses with a phone number")
    parser.add_argument("--with-services", action="store_true", help="Create 25 default services per provider")
    parser.add_argument("--limit", type=int, default=None, help="Max businesses to import")
    parser.add_argument("--cleanup", action="store_true", help="Remove all previously imported businesses")
    args = parser.parse_args()

    if args.cleanup:
        cleanup_imported(dry_run=args.dry_run)
        return

    businesses = load_scraped_data(Path(args.input))
    businesses = filter_businesses(businesses, args.require_address, args.require_phone)
    print(f"After filtering: {len(businesses)} businesses")

    if args.limit:
        businesses = businesses[:args.limit]
        print(f"Limited to: {len(businesses)} businesses")

    if not businesses:
        print("No businesses to import.")
        return

    stats = import_businesses(
        businesses,
        with_services=args.with_services,
        dry_run=args.dry_run,
    )

    print("\n" + "=" * 50)
    print("  IMPORT SUMMARY")
    print("=" * 50)
    print(f"  Created:          {stats['created']}")
    print(f"  Skipped (dupes):  {stats['skipped_duplicate']}")
    print(f"  Skipped (errors): {stats['skipped_error']}")
    if stats['services_created']:
        print(f"  Services created: {stats['services_created']}")
    print("=" * 50)


if __name__ == "__main__":
    main()
