---
name: scraper
description: Scrape UK nail & beauty businesses from OpenStreetMap and import into the database. Run manually or via cron. 100% free, no API key needed.
---

# UK Business Scraper

Scrapes nail salons, beauty salons, nail bars, and spas across the UK using OpenStreetMap Nominatim API.
**Cost: $0.00 — always free, no API key, no billing account.**

## Files

| File | Purpose |
|---|---|
| `backend/scripts/scraper/scrape_uk_businesses.py` | Main scraper — queries Nominatim + scrapes business websites |
| `backend/scripts/scraper/import_to_db.py` | Import scraped JSON into the database as providers + services |
| `backend/scripts/scraper/scrape_cron.py` | Cron wrapper — scrapes a few cities per run, rotates weekly |
| `backend/scripts/scraper/output/scraped_businesses.json` | Scraped data output (gitignored) |
| `backend/scripts/scraper/output/images/` | Downloaded business photos (gitignored) |
| `backend/scripts/scraper/output/cron_state.json` | Cron progress state (gitignored) |

## Quick Start

```bash
cd backend

# Install deps (if not already)
.venv/bin/pip install requests beautifulsoup4

# Scrape all 37 UK cities (takes ~5 min with website scraping)
.venv/bin/python scripts/scraper/scrape_uk_businesses.py

# Scrape specific cities
.venv/bin/python scripts/scraper/scrape_uk_businesses.py --cities "London,Manchester"

# Fast mode — skip website scraping (no emails/images, ~1 min)
.venv/bin/python scripts/scraper/scrape_uk_businesses.py --no-websites

# Test with limit
.venv/bin/python scripts/scraper/scrape_uk_businesses.py --limit 10
```

## Import to Database

```bash
cd backend

# Preview what will be imported
.venv/bin/python scripts/scraper/import_to_db.py --dry-run

# Import all with default services (25 nail services per provider)
.venv/bin/python scripts/scraper/import_to_db.py --with-services

# Import only businesses that have a phone number
.venv/bin/python scripts/scraper/import_to_db.py --with-services --require-phone

# Remove all previously imported businesses
.venv/bin/python scripts/scraper/import_to_db.py --cleanup
```

## Cron Setup (Incremental Scraping)

The cron script processes 5 cities per run and rotates through all 37 cities.
With a weekly cron, it covers all UK cities in ~8 weeks, then starts fresh.

**Nominatim rate limits:** 1 request/second. The batch approach (5 cities/run)
keeps us well within limits — ~30 API calls per run, spaced 1.1s apart.

```bash
# Manual test
cd backend && .venv/bin/python scripts/scraper/scrape_cron.py

# Setup weekly cron (every Sunday 3am)
crontab -e
0 3 * * 0 cd /path/to/backend && .venv/bin/python scripts/scraper/scrape_cron.py --no-websites >> scripts/scraper/output/cron.log 2>&1

# Check state
cat scripts/scraper/output/cron_state.json

# Reset rotation (start from city 1 again)
.venv/bin/python scripts/scraper/scrape_cron.py --reset
```

## Data Fields Collected

| Field | Source | Coverage |
|---|---|---|
| name | OSM | 100% |
| address | OSM addr tags | ~100% |
| latitude/longitude | OSM | 100% |
| phone | OSM extratags | ~20% |
| email | website scraping | ~5% |
| website | OSM extratags | ~10% |
| opening_hours | OSM extratags | ~10% |
| category | OSM shop/amenity type | 100% |
| photos | website scraping | varies |

## How Deduplication Works

- **Scraper:** deduplicates by `osm_id` (unique per OSM node/way)
- **Import:** stores `osm_id` in provider's `settings` JSON, skips on re-import
- **Cron:** merges into existing `scraped_businesses.json`, only adds new IDs
- **Cleanup:** `--cleanup` flag removes all providers with `import_source=scraped-uk-import`

## Deploy to Production

### One-shot (manual)

```bash
cd backend
bash scripts/scraper/scrape_and_deploy.sh
```

This will: scrape all UK → SSH into prod → clean old seed/test data → import scraped businesses + 25 services each.

### GitHub Actions (automated weekly)

Workflow: `.github/workflows/scrape-uk-businesses.yml`
- Runs every **Sunday 3am UTC**
- Can also be triggered manually from GitHub UI (Actions → "Scrape UK Businesses" → Run workflow)
- Requires `EC2_SSH_KEY` secret in GitHub repo settings (same key as deployment)
- Saves scraped JSON as a build artifact (30-day retention)

### What gets cleaned on prod

1. **Seed data** — providers with `email LIKE '%probook-demo%'` (from `seed_mock_data.py`)
2. **Previous imports** — providers with `settings->import_source = 'scraped-uk-import'`
3. Related services, work_slots, professional_providers, sessions are all deleted in correct FK order

## Important Rules

1. **NEVER use Google Places API** — it requires billing. Use Nominatim only.
2. **Rate limit: 1 req/sec** — the scraper enforces 1.1s delay. Do not lower it.
3. **Cron batch size: 5 cities** — keeps each run under 30 API calls. Safe to increase to 10 but no higher.
4. **Always `--resume`** when rerunning the full scraper to avoid re-scraping.
5. **Website scraping is polite** — 0.5s delay between sites, proper User-Agent header.
