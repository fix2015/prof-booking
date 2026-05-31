"""
Cron-safe wrapper for the UK business scraper.
===============================================
Designed to run on a schedule (e.g. once/week) and incrementally
scrape new businesses without hitting Nominatim rate limits.

Nominatim policy: max 1 request/second, no heavy bulk usage.
This script processes a FEW cities per run, rotating through all 37
cities over multiple runs. Completely safe and free.

Cron setup (scrape ~5 cities every Sunday at 3am):
    crontab -e
    0 3 * * 0 cd /path/to/backend && .venv/bin/python scripts/scraper/scrape_cron.py >> scripts/scraper/output/cron.log 2>&1

Or run manually:
    cd backend && python scripts/scraper/scrape_cron.py
    cd backend && python scripts/scraper/scrape_cron.py --batch-size 10
"""

import argparse
import json
import sys
from datetime import datetime
from pathlib import Path

# Allow importing the main scraper
sys.path.insert(0, str(Path(__file__).parent))

from scrape_uk_businesses import (
    DEFAULT_CITIES,
    OUTPUT_DIR,
    scrape,
    save_results,
    print_summary,
)

STATE_FILE = OUTPUT_DIR / "cron_state.json"
DEFAULT_BATCH_SIZE = 5  # cities per cron run


def load_state() -> dict:
    """Load cron state (which cities have been scraped, next offset)."""
    if STATE_FILE.exists():
        with open(STATE_FILE) as f:
            return json.load(f)
    return {"next_city_index": 0, "total_runs": 0, "last_run": None}


def save_state(state: dict) -> None:
    """Save cron state."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    with open(STATE_FILE, "w") as f:
        json.dump(state, f, indent=2)


def load_existing() -> list[dict]:
    """Load previously scraped businesses."""
    out_path = OUTPUT_DIR / "scraped_businesses.json"
    if out_path.exists():
        with open(out_path) as f:
            data = json.load(f)
            return data.get("businesses", [])
    return []


def main():
    parser = argparse.ArgumentParser(description="Cron wrapper for UK business scraper")
    parser.add_argument(
        "--batch-size", type=int, default=DEFAULT_BATCH_SIZE,
        help=f"Number of cities to scrape per run (default: {DEFAULT_BATCH_SIZE})",
    )
    parser.add_argument(
        "--no-websites", action="store_true",
        help="Skip website scraping (faster)",
    )
    parser.add_argument(
        "--reset", action="store_true",
        help="Reset cron state (start from first city again)",
    )
    args = parser.parse_args()

    now = datetime.now().astimezone().isoformat()
    print(f"\n{'='*60}")
    print(f"  Cron scraper run — {now}")
    print("  Cost: $0.00")
    print(f"{'='*60}")

    if args.reset:
        save_state({"next_city_index": 0, "total_runs": 0, "last_run": None})
        print("  State reset. Will start from first city on next run.")
        return

    state = load_state()
    start_idx = state["next_city_index"]
    end_idx = start_idx + args.batch_size

    # Get the batch of cities for this run
    if start_idx >= len(DEFAULT_CITIES):
        # We've been through all cities — wrap around
        start_idx = 0
        end_idx = args.batch_size

    batch_cities = DEFAULT_CITIES[start_idx:end_idx]
    next_idx = end_idx if end_idx < len(DEFAULT_CITIES) else 0

    print(f"  Cities this batch: {', '.join(batch_cities)}")
    print(f"  Progress: cities {start_idx+1}-{min(end_idx, len(DEFAULT_CITIES))} of {len(DEFAULT_CITIES)}")
    print(f"  Run #{state['total_runs'] + 1}")

    # Load existing data for merge
    existing = load_existing()
    existing_ids = {b["osm_id"] for b in existing if b.get("osm_id")}
    print(f"  Existing businesses: {len(existing)}")

    # Scrape this batch
    new_businesses = scrape(
        cities=batch_cities,
        scrape_websites=not args.no_websites,
        download_images=True,
    )

    # Merge — add only truly new businesses
    added = 0
    for b in new_businesses:
        osm_id = b.get("osm_id", "")
        if osm_id and osm_id not in existing_ids:
            existing.append(b)
            existing_ids.add(osm_id)
            added += 1

    # Save merged results
    save_results(existing)

    # Update state
    state["next_city_index"] = next_idx
    state["total_runs"] += 1
    state["last_run"] = now
    state["last_batch_cities"] = [c for c in batch_cities]
    state["last_batch_added"] = added
    save_state(state)

    print(f"\n  New businesses added: {added}")
    print(f"  Total businesses now: {len(existing)}")
    print(f"  Next run will scrape: {', '.join(DEFAULT_CITIES[next_idx:next_idx+args.batch_size])}")
    print(f"  Full cycle completes in ~{(len(DEFAULT_CITIES) + args.batch_size - 1) // args.batch_size} runs")

    print_summary(existing)


if __name__ == "__main__":
    main()
