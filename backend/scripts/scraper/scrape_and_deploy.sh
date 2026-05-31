#!/usr/bin/env bash
#
# Full pipeline: scrape UK businesses → clean old data from prod → import to prod DB
#
# Usage:
#   cd backend
#   bash scripts/scraper/scrape_and_deploy.sh
#
# Requirements:
#   - SSH config with "probooking" host alias (or set SSH_HOST env var)
#   - Python venv with requests, beautifulsoup4 installed
#
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/output"

SSH_HOST="${SSH_HOST:-probooking}"

echo "============================================================"
echo "  UK Business Scraper → Prod Deploy Pipeline"
echo "  Cost: \$0.00"
echo "============================================================"

# ── Step 1: Scrape ──────────────────────────────────────────────────────────
echo ""
echo "Step 1: Scraping UK businesses..."
cd "$BACKEND_DIR"

PYTHON="${BACKEND_DIR}/.venv/bin/python"
if [ ! -f "$PYTHON" ]; then
    PYTHON="python3"
fi

$PYTHON scripts/scraper/scrape_uk_businesses.py --no-images

SCRAPED_FILE="$OUTPUT_DIR/scraped_businesses.json"
if [ ! -f "$SCRAPED_FILE" ]; then
    echo "ERROR: Scraped file not found at $SCRAPED_FILE"
    exit 1
fi

TOTAL=$(python3 -c "import json; print(json.load(open('$SCRAPED_FILE'))['total_count'])")
echo "  Scraped $TOTAL businesses"

# ── Step 2: Copy to prod ───────────────────────────────────────────────────
echo ""
echo "Step 2: Copying scraped data to prod server..."
scp "$SCRAPED_FILE" "${SSH_HOST}:/tmp/scraped_businesses.json"
echo "  Done"

# ── Step 3: Clean old data + import on prod ────────────────────────────────
echo ""
echo "Step 3: Cleaning old data & importing on prod..."
ssh "$SSH_HOST" << 'ENDSSH'
set -e

sudo docker cp /tmp/scraped_businesses.json nail_backend:/tmp/scraped_businesses.json

sudo docker exec nail_backend python -c "
import sys, json
sys.path.insert(0, '/app')
from datetime import datetime, timezone
from app.database import SessionLocal
from sqlalchemy import text

db = SessionLocal()
try:
    # --- Clean old seed + imported data ---
    rows = db.execute(text(
        \"SELECT id FROM providers WHERE email LIKE '%probook-demo%' OR settings::text LIKE '%scraped-uk-import%'\"
    )).fetchall()
    if rows:
        ids = [r[0] for r in rows]
        id_list = ','.join(str(i) for i in ids)
        svc_rows = db.execute(text(f'SELECT service_id FROM service_providers WHERE provider_id IN ({id_list})')).fetchall()
        svc_ids = [r[0] for r in svc_rows]
        db.execute(text(f'DELETE FROM work_slots WHERE provider_id IN ({id_list})'))
        db.execute(text(f'DELETE FROM professional_providers WHERE provider_id IN ({id_list})'))
        db.execute(text(f'DELETE FROM service_providers WHERE provider_id IN ({id_list})'))
        if svc_ids:
            db.execute(text(f\"DELETE FROM services WHERE id IN ({','.join(str(i) for i in svc_ids)})\"))
        db.execute(text(f'DELETE FROM sessions WHERE provider_id IN ({id_list})'))
        db.execute(text(f'DELETE FROM providers WHERE id IN ({id_list})'))
        db.commit()
        print(f'Cleaned {len(ids)} old providers')
    else:
        print('Nothing to clean')

    # --- Import new data ---
    with open('/tmp/scraped_businesses.json') as f:
        businesses = json.load(f).get('businesses', [])

    SVC_LIST = [
        ('Gel Manicure', 45, 35.00), ('Acrylic Full Set', 90, 55.00),
        ('Gel Pedicure', 50, 40.00), ('Nail Art Design', 60, 45.00),
        ('Dip Powder Manicure', 45, 38.00), ('French Manicure', 40, 30.00),
        ('Shellac Manicure', 35, 28.00), ('Nail Extensions', 75, 50.00),
        ('Classic Manicure', 30, 22.00), ('Classic Pedicure', 40, 28.00),
        ('Nail Removal', 20, 15.00), ('Nail Repair', 20, 12.00),
        ('Infill Acrylic', 60, 40.00), ('Chrome Powder Nails', 50, 42.00),
        ('Ombre Nails', 60, 48.00), ('Builder Gel Overlay', 50, 38.00),
        ('Cuticle Care Treatment', 25, 18.00), ('3D Nail Art', 75, 55.00),
        ('Luxury Manicure & Spa', 60, 50.00), ('Polygel Application', 70, 52.00),
        ('Hard Gel Nails', 65, 45.00), ('Russian Manicure', 50, 35.00),
        ('Nail Stamping Art', 45, 32.00), ('Encapsulated Nail Art', 70, 58.00),
        ('Paraffin Wax Treatment', 30, 25.00),
    ]

    now = datetime.now(timezone.utc).isoformat()
    created = 0
    for b in businesses:
        if not b.get('name'):
            continue
        slug = b['name'].lower().replace(' ', '').replace('&', '')[:20]
        logo = b.get('logo_url') or f'https://picsum.photos/seed/{slug}/200/200'
        settings = json.dumps({
            'osm_id': b.get('osm_id', ''),
            'import_source': 'scraped-uk-import',
            'source': 'openstreetmap',
            'website': b.get('website', ''),
            'opening_hours': b.get('opening_hours', []),
        })
        result = db.execute(text(
            'INSERT INTO providers (name, address, phone, email, description, logo_url, '
            'category, latitude, longitude, is_active, worker_payment_amount, deposit_percentage, '
            'settings, created_at, updated_at) '
            'VALUES (:name, :address, :phone, :email, :description, :logo_url, '
            ':category, :lat, :lng, true, 0.0, 10.0, CAST(:settings AS jsonb), '
            ':now, :now) RETURNING id'
        ), {
            'name': b['name'], 'address': b.get('address'),
            'phone': b.get('phone'), 'email': b.get('email'),
            'description': b.get('description', ''), 'logo_url': logo,
            'category': b.get('category', 'Beauty & Nails'),
            'lat': b.get('latitude'), 'lng': b.get('longitude'),
            'settings': settings, 'now': now,
        })
        provider_id = result.fetchone()[0]

        for svc_name, dur, price in SVC_LIST:
            svc_result = db.execute(text(
                'INSERT INTO services (name, duration_minutes, price, is_active, created_at, updated_at) '
                'VALUES (:name, :dur, :price, true, :now, :now) RETURNING id'
            ), {'name': svc_name, 'dur': dur, 'price': price, 'now': now})
            svc_id = svc_result.fetchone()[0]
            db.execute(text(
                'INSERT INTO service_providers (service_id, provider_id) VALUES (:svc_id, :prov_id)'
            ), {'svc_id': svc_id, 'prov_id': provider_id})

        created += 1
        if created % 100 == 0:
            print(f'  ...{created} providers')

    db.commit()
    print(f'Imported {created} providers with {created * len(SVC_LIST)} services')

    # Verify
    total = db.execute(text('SELECT COUNT(*) FROM providers')).scalar()
    print(f'Total providers in DB: {total}')
finally:
    db.close()
"

rm -f /tmp/scraped_businesses.json
ENDSSH

echo ""
echo "============================================================"
echo "  DONE! $TOTAL businesses imported to prod"
echo "  Cost: \$0.00"
echo "  Live at: https://probooking.app"
echo "============================================================"
