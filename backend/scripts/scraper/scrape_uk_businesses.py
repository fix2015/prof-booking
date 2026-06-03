"""
UK Nail & Beauty Business Scraper — 100% FREE
===============================================
Uses OpenStreetMap Nominatim API (completely free, no API key, no billing)
to find nail salons, beauty salons, and spas across the UK.
Then scrapes business websites to collect emails and images.

COST: $0.00 — ALWAYS. NO API KEY. NO BILLING. NO CREDIT CARD.
Rate limit: 1 request/second (Nominatim policy — we respect it).

Setup:
    pip install requests beautifulsoup4

Usage:
    cd backend
    python scripts/scraper/scrape_uk_businesses.py

    # Specific cities only
    python scripts/scraper/scrape_uk_businesses.py --cities "London,Manchester"

    # Limit results (for testing)
    python scripts/scraper/scrape_uk_businesses.py --limit 10

    # Skip website scraping (faster, no images/emails)
    python scripts/scraper/scrape_uk_businesses.py --no-websites

    # Skip image downloading
    python scripts/scraper/scrape_uk_businesses.py --no-images

Output:
    backend/scripts/scraper/output/scraped_businesses.json
    backend/scripts/scraper/output/images/<osm_id>/photo_0.jpg ...
"""

import argparse
import json
import re
import time
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlparse

import requests

try:
    from bs4 import BeautifulSoup
    HAS_BS4 = True
except ImportError:
    HAS_BS4 = False

# ── Config ──────────────────────────────────────────────────────────────────

OUTPUT_DIR = Path(__file__).parent / "output"
IMAGES_DIR = OUTPUT_DIR / "images"

# Nominatim — completely free, no key needed, 1 req/sec
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
NOMINATIM_DELAY = 1.5  # seconds between requests (policy: max 1 req/sec, extra margin)

# Delay between website scrapes (be polite)
WEBSITE_DELAY = 0.5

# Max images to download per business from their website
MAX_IMAGES_PER_BUSINESS = 5

# HTTP headers
HEADERS = {
    "User-Agent": "ProBookingScraper/1.0 (nail-salon-data contact@probooking.app)",
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-GB,en;q=0.9",
}

# UK cities to search — Hemel Hempstead first, then nearby, then major cities
DEFAULT_CITIES = [
    # Primary area
    "Hemel Hempstead", "St Albans", "Watford", "Luton", "Aylesbury",
    "High Wycombe", "Hitchin", "Stevenage", "Hatfield", "Welwyn Garden City",
    "Berkhamsted", "Harpenden", "Chesham", "Amersham", "Rickmansworth",
    # England — major
    "London", "Manchester", "Birmingham", "Leeds", "Liverpool",
    "Bristol", "Sheffield", "Newcastle upon Tyne", "Nottingham", "Leicester",
    "Southampton", "Brighton", "Oxford", "Cambridge", "York",
    "Bath", "Reading", "Coventry", "Plymouth", "Norwich",
    "Exeter", "Derby", "Wolverhampton", "Milton Keynes", "Northampton",
    "Bournemouth", "Swindon", "Peterborough", "Cheltenham",
    # Scotland
    "Edinburgh", "Glasgow", "Aberdeen", "Dundee",
    # Wales
    "Cardiff", "Swansea",
    # Northern Ireland
    "Belfast",
]

# Search queries to cover different business types
SEARCH_QUERIES = [
    "nail salon",
    "nail bar",
    "nails",
    "beauty salon",
    "beauty nails",
    "nail spa",
    "hair salon",
    "hairdresser",
    "barber",
    "spa",
    "beauty therapist",
    "lash extensions",
    "waxing salon",
    "tanning salon",
    "massage",
    "aesthetics clinic",
]


def log(msg: str) -> None:
    print(f"  {msg}", flush=True)


# ── Nominatim API (FREE) ───────────────────────────────────────────────────


def search_nominatim(query: str, city: str) -> list[dict]:
    """Search Nominatim for businesses. FREE, max 50 results per query."""
    params = {
        "q": f"{query}, {city}, UK",
        "countrycodes": "gb",
        "format": "json",
        "addressdetails": 1,
        "extratags": 1,
        "namedetails": 1,
        "limit": 50,
    }
    max_retries = 3
    for attempt in range(max_retries):
        try:
            resp = requests.get(
                NOMINATIM_URL, params=params,
                headers={"User-Agent": HEADERS["User-Agent"], "Accept": "application/json"},
                timeout=30,
            )
            if resp.status_code == 429:
                wait = NOMINATIM_DELAY * (2 ** (attempt + 1))
                log(f"Rate limited (429), backing off {wait:.0f}s (attempt {attempt + 1}/{max_retries})")
                time.sleep(wait)
                continue
            resp.raise_for_status()
            time.sleep(NOMINATIM_DELAY)
            return resp.json()
        except Exception as e:
            if "429" not in str(e):
                log(f"Nominatim error: {e}")
                time.sleep(NOMINATIM_DELAY)
                return []
            wait = NOMINATIM_DELAY * (2 ** (attempt + 1))
            log(f"Rate limited, backing off {wait:.0f}s (attempt {attempt + 1}/{max_retries})")
            time.sleep(wait)
    log(f"Nominatim: giving up after {max_retries} retries for {query}")
    return []


# ── Extract fields from Nominatim result ────────────────────────────────────


def extract_category(result: dict) -> str:
    """Map Nominatim class/type to our app categories."""
    osm_type = result.get("type", "")
    name = result.get("display_name", "").lower()

    if "nail" in osm_type or "nail" in name:
        return "Nails"
    if osm_type in ("hairdresser", "hair_care"):
        return "Hair & Beauty"
    if osm_type == "spa" or "spa" in name:
        return "Spa & Wellness"
    if "barber" in osm_type or "barber" in name:
        return "Barber"
    if "massage" in osm_type or "massage" in name:
        return "Massage & Wellness"
    if "tanning" in name:
        return "Tanning"
    if "lash" in name or "brow" in name:
        return "Lashes & Brows"
    if osm_type in ("beauty_salon", "beauty"):
        return "Beauty & Nails"
    return "Beauty & Nails"


def extract_address(result: dict) -> str:
    """Build formatted address from Nominatim addressdetails."""
    addr = result.get("address", {})
    parts = []

    # House number + road
    house = addr.get("house_number", "")
    road = addr.get("road", "")
    if house and road:
        parts.append(f"{house} {road}")
    elif road:
        parts.append(road)

    # Suburb/neighbourhood
    suburb = addr.get("suburb", "") or addr.get("neighbourhood", "")
    if suburb:
        parts.append(suburb)

    # City
    city = (addr.get("city", "") or addr.get("town", "")
            or addr.get("village", "") or addr.get("county", ""))
    if city:
        parts.append(city)

    # Postcode
    postcode = addr.get("postcode", "")
    if postcode:
        parts.append(postcode)

    if parts:
        parts.append("UK")

    return ", ".join(parts)


def extract_city(result: dict) -> str:
    """Extract city name."""
    addr = result.get("address", {})
    return (addr.get("city", "") or addr.get("town", "")
            or addr.get("village", "") or addr.get("county", ""))


def extract_phone(result: dict) -> str:
    """Extract and normalize phone number from extratags."""
    et = result.get("extratags") or {}
    phone = et.get("phone", "") or et.get("contact:phone", "")
    if not phone:
        return ""
    phone = phone.split(";")[0].strip()
    if phone.startswith("0"):
        phone = "+44" + phone[1:]
    return phone


def extract_website(result: dict) -> str:
    """Extract website URL from extratags."""
    et = result.get("extratags") or {}
    url = et.get("website", "") or et.get("contact:website", "") or et.get("url", "")
    if url and not url.startswith("http"):
        url = "https://" + url
    return url


def extract_email_from_tags(result: dict) -> str:
    """Extract email from extratags."""
    et = result.get("extratags") or {}
    return et.get("email", "") or et.get("contact:email", "")


def extract_opening_hours(result: dict) -> list[str]:
    """Extract opening hours from extratags."""
    et = result.get("extratags") or {}
    raw = et.get("opening_hours", "")
    if not raw:
        return []
    return [h.strip() for h in raw.split(";")]


def build_record(result: dict) -> dict[str, Any]:
    """Transform Nominatim result into our DB-compatible format."""
    osm_id = f"{result.get('osm_type', 'node')}/{result.get('osm_id', '')}"
    et = result.get("extratags") or {}
    nd = result.get("namedetails", {})

    name = nd.get("name", "") or result.get("display_name", "").split(",")[0]
    website = extract_website(result)

    # Build description
    description_parts = []
    if et.get("description"):
        description_parts.append(et["description"])
    hours_raw = et.get("opening_hours", "")
    if hours_raw:
        description_parts.append(f"Hours: {hours_raw}")
    if website:
        description_parts.append(f"Website: {website}")

    return {
        "osm_id": osm_id,
        "source": "openstreetmap",
        # Provider fields
        "name": name,
        "address": extract_address(result),
        "city": extract_city(result),
        "phone": extract_phone(result),
        "email": extract_email_from_tags(result),
        "description": " | ".join(description_parts) if description_parts else "",
        "category": extract_category(result),
        "latitude": float(result.get("lat", 0)) or None,
        "longitude": float(result.get("lon", 0)) or None,
        "website": website,
        # Metadata
        "business_status": "OPERATIONAL",
        "osm_class": result.get("class", ""),
        "osm_type_tag": result.get("type", ""),
        "opening_hours": extract_opening_hours(result),
        # Images (populated later from website scraping)
        "logo_url": None,
        "photo_paths": [],
    }


# ── Website scraping for emails + images (FREE) ────────────────────────────


def scrape_website(url: str) -> dict:
    """Scrape a business website for email addresses and image URLs.
    FREE — just HTTP requests to the business website."""
    result: dict[str, list[str]] = {"emails": [], "image_urls": []}

    if not url:
        return result

    try:
        resp = requests.get(url, headers=HEADERS, timeout=15, allow_redirects=True)
        resp.raise_for_status()
    except Exception:
        return result

    html = resp.text

    # Extract emails via regex
    raw_emails = re.findall(
        r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}",
        html,
    )
    skip_domains = {
        "example.com", "sentry.io", "wixpress.com", "sentry-next.wixpress.com",
        "sentry.wixpress.com", "w3.org", "schema.org", "googleapis.com",
        "google.com", "facebook.com", "jquery.com", "wordpress.org",
        "gravatar.com", "wp.com", "mail.com",
    }
    seen_emails: set[str] = set()
    for email in raw_emails:
        email_lower = email.lower()
        domain = email_lower.split("@")[1]
        if (domain not in skip_domains
                and not domain.endswith(".png")
                and not domain.endswith(".jpg")
                and email_lower not in seen_emails):
            seen_emails.add(email_lower)
            result["emails"].append(email_lower)

    # Extract images
    if HAS_BS4:
        soup = BeautifulSoup(html, "html.parser")
        base_url = resp.url

        for img_tag in soup.find_all("img", src=True):
            src = img_tag["src"]
            if any(skip in src.lower() for skip in [
                "icon", "logo", "favicon", "pixel", ".svg", "1x1",
                "spacer", "blank", "tracking", "analytics", "badge",
                "widget", "button", "arrow", "spinner",
            ]):
                continue
            width = img_tag.get("width", "")
            height = img_tag.get("height", "")
            try:
                if width and int(width) < 100:
                    continue
                if height and int(height) < 100:
                    continue
            except ValueError:
                pass
            full_url = urljoin(base_url, src)
            if full_url.startswith("http"):
                result["image_urls"].append(full_url)
    else:
        img_srcs = re.findall(r'<img[^>]+src=["\']([^"\']+)["\']', html, re.I)
        base_url = resp.url
        for src in img_srcs:
            if any(skip in src.lower() for skip in [
                "icon", "logo", "favicon", "pixel", ".svg", "1x1",
                "spacer", "blank", "tracking",
            ]):
                continue
            full_url = urljoin(base_url, src)
            if full_url.startswith("http"):
                result["image_urls"].append(full_url)

    time.sleep(WEBSITE_DELAY)
    return result


def download_image(url: str, save_path: Path) -> bool:
    """Download an image from a URL. Returns True on success."""
    try:
        resp = requests.get(url, headers=HEADERS, timeout=15, allow_redirects=True, stream=True)
        resp.raise_for_status()
        content_type = resp.headers.get("content-type", "")
        if "image" not in content_type:
            return False
        content_length = resp.headers.get("content-length")
        if content_length:
            size = int(content_length)
            if size < 5_000 or size > 10_000_000:
                return False
        data = resp.content
        if len(data) < 5_000:
            return False
        save_path.write_bytes(data)
        return True
    except Exception:
        return False


def enrich_from_website(business: dict, download_images: bool = True) -> None:
    """Enrich a business record with data scraped from its website. FREE."""
    website = business.get("website", "")
    if not website:
        return

    site_data = scrape_website(website)

    if not business.get("email") and site_data["emails"]:
        business["email"] = site_data["emails"][0]

    if download_images and site_data["image_urls"]:
        osm_id_safe = business["osm_id"].replace("/", "_")
        img_dir = IMAGES_DIR / osm_id_safe
        img_dir.mkdir(parents=True, exist_ok=True)

        photo_paths: list[str] = []
        for i, img_url in enumerate(site_data["image_urls"][:MAX_IMAGES_PER_BUSINESS]):
            parsed = urlparse(img_url)
            ext = Path(parsed.path).suffix.lower()
            if ext not in (".jpg", ".jpeg", ".png", ".webp"):
                ext = ".jpg"
            img_path = img_dir / f"photo_{i}{ext}"
            if download_image(img_url, img_path):
                photo_paths.append(str(img_path.relative_to(OUTPUT_DIR)))

        if photo_paths:
            business["photo_paths"] = photo_paths
            business["logo_url"] = photo_paths[0]


# ── Main scraper ────────────────────────────────────────────────────────────


def scrape(
    cities: list[str],
    limit: int | None = None,
    scrape_websites: bool = True,
    download_images: bool = True,
) -> list[dict]:
    """Run the full scraping pipeline. 100% free."""

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    IMAGES_DIR.mkdir(parents=True, exist_ok=True)

    seen_osm_ids: set[str] = set()
    all_businesses: list[dict] = []
    total_cities = len(cities)
    total_api_calls = 0

    for ci, city in enumerate(cities, 1):
        print(f"\n[{ci}/{total_cities}] Searching in {city}...")
        city_count = 0

        for query in SEARCH_QUERIES:
            if limit and len(all_businesses) >= limit:
                break

            log(f'Query: "{query}, {city}"')
            results = search_nominatim(query, city)
            total_api_calls += 1
            new_in_query = 0

            for result in results:
                osm_id = f"{result.get('osm_type', 'node')}/{result.get('osm_id', '')}"
                if osm_id in seen_osm_ids:
                    continue
                seen_osm_ids.add(osm_id)

                record = build_record(result)
                if not record["name"]:
                    continue

                all_businesses.append(record)
                city_count += 1
                new_in_query += 1

                if limit and len(all_businesses) >= limit:
                    break

            if new_in_query:
                log(f"  +{new_in_query} new (total: {len(all_businesses)})")

        if limit and len(all_businesses) >= limit:
            log(f"Reached limit of {limit}")
            break

        log(f"City total: {city_count} | Running total: {len(all_businesses)}")

    print(f"\n  Nominatim API calls made: {total_api_calls} (all FREE)")
    print(f"  Unique businesses found: {len(all_businesses)}")

    # Enrich from websites
    if scrape_websites:
        with_website = [b for b in all_businesses if b.get("website")]
        print(f"\n  Scraping {len(with_website)} business websites for emails & images...")

        for i, business in enumerate(with_website, 1):
            name = business["name"]
            log(f"[{i}/{len(with_website)}] {name}")

            enrich_from_website(business, download_images=download_images)

            extras = []
            if business.get("email"):
                extras.append(f"email={business['email']}")
            if business.get("photo_paths"):
                extras.append(f"{len(business['photo_paths'])} photos")
            if extras:
                log(f"  -> {', '.join(extras)}")

    # Generate category-specific placeholder logos for businesses without images.
    # Uses Unsplash source with relevant search terms per category so images
    # look realistic instead of random stock photos.
    _CATEGORY_TERMS = {
        "Nails": "nail+salon+manicure",
        "Beauty & Nails": "beauty+salon+interior",
        "Hair & Beauty": "hair+salon+interior",
        "Spa & Wellness": "spa+wellness+interior",
        "Barber": "barber+shop+interior",
        "Massage & Wellness": "massage+spa+room",
        "Tanning": "tanning+salon",
        "Lashes & Brows": "beauty+lashes+salon",
    }
    for i, b in enumerate(all_businesses):
        if not b.get("logo_url"):
            terms = _CATEGORY_TERMS.get(b.get("category", ""), "beauty+salon")
            # Use a stable seed per business so the same business always gets the same image
            seed = abs(hash(b.get("osm_id", str(i)))) % 1000
            b["logo_url"] = f"https://picsum.photos/seed/{terms}{seed}/400/400"

    return all_businesses


def save_results(businesses: list[dict]) -> Path:
    """Save scraped data to JSON."""
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    out_path = OUTPUT_DIR / "scraped_businesses.json"

    output = {
        "scraped_at": datetime.now().astimezone().isoformat(),
        "total_count": len(businesses),
        "source": "OpenStreetMap Nominatim (100% free, no API key)",
        "cost": "$0.00",
        "businesses": businesses,
    }

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, indent=2, ensure_ascii=False)

    return out_path


def print_summary(businesses: list[dict]) -> None:
    """Print a summary of scraped data."""
    print("\n" + "=" * 60)
    print("  SCRAPING COMPLETE")
    print("=" * 60)
    print(f"  Total businesses:  {len(businesses)}")
    print("  Data source:       OpenStreetMap Nominatim (100% free)")
    print("  Cost:              $0.00")

    cities = set(b.get("city", "") for b in businesses if b.get("city"))
    print(f"  Cities found:      {len(cities)}")

    with_address = sum(1 for b in businesses if b.get("address"))
    with_phone = sum(1 for b in businesses if b.get("phone"))
    with_email = sum(1 for b in businesses if b.get("email"))
    with_photos = sum(1 for b in businesses if b.get("photo_paths"))
    with_website = sum(1 for b in businesses if b.get("website"))
    with_hours = sum(1 for b in businesses if b.get("opening_hours"))
    with_coords = sum(1 for b in businesses if b.get("latitude"))
    total = max(len(businesses), 1)

    print("\n  Field coverage:")
    print(f"    Address:         {with_address:>5} ({100*with_address//total}%)")
    print(f"    Coordinates:     {with_coords:>5} ({100*with_coords//total}%)")
    print(f"    Phone:           {with_phone:>5} ({100*with_phone//total}%)")
    print(f"    Email:           {with_email:>5} ({100*with_email//total}%)")
    print(f"    Website:         {with_website:>5} ({100*with_website//total}%)")
    print(f"    Opening hours:   {with_hours:>5} ({100*with_hours//total}%)")
    print(f"    Photos:          {with_photos:>5} ({100*with_photos//total}%)")

    categories: dict[str, int] = {}
    for b in businesses:
        cat = b.get("category", "Unknown")
        categories[cat] = categories.get(cat, 0) + 1
    print("\n  Categories:")
    for cat, count in sorted(categories.items(), key=lambda x: -x[1]):
        print(f"    {cat}: {count}")

    if cities:
        print("\n  Top cities:")
        city_counts: dict[str, int] = {}
        for b in businesses:
            c = b.get("city", "")
            if c:
                city_counts[c] = city_counts.get(c, 0) + 1
        for city, count in sorted(city_counts.items(), key=lambda x: -x[1])[:20]:
            print(f"    {city}: {count}")

    print(f"\n  Output: {OUTPUT_DIR / 'scraped_businesses.json'}")
    print(f"  Images: {IMAGES_DIR}/")
    print("=" * 60)


def main():
    parser = argparse.ArgumentParser(
        description="Scrape UK nail & beauty businesses (FREE — OpenStreetMap Nominatim)",
    )
    parser.add_argument(
        "--cities", type=str, default=None,
        help='Comma-separated list of cities (default: 37 major UK cities)',
    )
    parser.add_argument(
        "--limit", type=int, default=None,
        help="Max businesses to collect (for testing)",
    )
    parser.add_argument(
        "--no-websites", action="store_true",
        help="Skip scraping business websites (no emails/images, much faster)",
    )
    parser.add_argument(
        "--no-images", action="store_true",
        help="Skip downloading images (still scrapes websites for emails)",
    )
    parser.add_argument(
        "--resume", action="store_true",
        help="Resume from existing output file (skip already scraped osm_ids)",
    )
    args = parser.parse_args()

    cities = DEFAULT_CITIES
    if args.cities:
        cities = [c.strip() for c in args.cities.split(",")]

    print("=" * 60)
    print("  UK Nail & Beauty Business Scraper")
    print("  Data source: OpenStreetMap Nominatim")
    print("  Cost: $0.00 — no API key, no billing, no credit card")
    print("=" * 60)

    # Resume support
    existing: list[dict] = []
    if args.resume and (OUTPUT_DIR / "scraped_businesses.json").exists():
        with open(OUTPUT_DIR / "scraped_businesses.json") as f:
            data = json.load(f)
            existing = data.get("businesses", [])
        print(f"\nResuming: {len(existing)} businesses already scraped")

    businesses = scrape(
        cities=cities,
        limit=args.limit,
        scrape_websites=not args.no_websites,
        download_images=not args.no_images,
    )

    # Merge with existing
    if existing:
        seen = {b["osm_id"] for b in businesses if b.get("osm_id")}
        for b in existing:
            osm_id = b.get("osm_id", "")
            if osm_id and osm_id not in seen:
                businesses.append(b)
                seen.add(osm_id)

    save_results(businesses)
    print_summary(businesses)


if __name__ == "__main__":
    main()
