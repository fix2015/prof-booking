"""
Seed clearly-labelled SAMPLE salons, professionals, services and reviews with real stock photos.

Everything created here carries is_demo=True (providers, professionals, reviews) and uses
@probook-demo.sample e-mail addresses, so the UI shows a "Sample" badge, bookings are refused
by the API, and `--wipe` removes it all in one go. Photos come from Pexels (free licence,
https://www.pexels.com/license/) and are re-hosted on the app's S3 bucket like normal uploads.

Run on the server (needs DB + S3 credentials from the backend .env):
    cd /var/www/prof-booking/backend
    PEXELS_API_KEY=xxxx .venv/bin/python scripts/seed_demo.py --salons 20
    .venv/bin/python scripts/seed_demo.py --wipe          # remove all sample data
    .venv/bin/python scripts/seed_demo.py --dry-run       # print the plan, touch nothing
Pexels API key: https://www.pexels.com/api/ (free, instant).
"""
from __future__ import annotations

import argparse
import os
import random
import sys
import time
from datetime import datetime, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.environ.setdefault("APP_SECRET_KEY", "seed")
os.environ.setdefault("JWT_SECRET_KEY", "seed")

import httpx
from sqlalchemy import text

import app.main  # noqa: F401  (registers every model so relationships resolve)
from app.database import SessionLocal
from app.modules.masters.models import (
    Professional,
    ProfessionalPhoto,
    ProfessionalProvider,
    ProfessionalStatus,
)
from app.modules.reviews.models import Review
from app.modules.salons.models import Provider, ProviderOwner
from app.modules.services.models import Service
from app.modules.users.models import User, UserRole
from app.modules.users.services import hash_password

DEMO_DOMAIN = "probook-demo.sample"
random.seed(20261006)

# ───────────────────────────── content ─────────────────────────────

TOWNS = [  # (town, postcode prefix, lat, lng)
    ("Hemel Hempstead", "HP1", 51.7526, -0.4421), ("St Albans", "AL1", 51.7520, -0.3360), ("Watford", "WD17", 51.6565, -0.3903),
    ("Luton", "LU1", 51.8787, -0.4200), ("Milton Keynes", "MK9", 52.0406, -0.7594), ("Harpenden", "AL5", 51.8175, -0.3570),
    ("Berkhamsted", "HP4", 51.7600, -0.5630), ("Tring", "HP23", 51.7960, -0.6590), ("Hitchin", "SG5", 51.9490, -0.2830),
    ("Stevenage", "SG1", 51.9020, -0.2020), ("Welwyn Garden City", "AL8", 51.8010, -0.2060), ("Hatfield", "AL10", 51.7630, -0.2250),
    ("Aylesbury", "HP20", 51.8152, -0.8098), ("Dunstable", "LU6", 51.8860, -0.5210), ("Rickmansworth", "WD3", 51.6390, -0.4700),
    ("Borehamwood", "WD6", 51.6570, -0.2720), ("Barnet", "EN5", 51.6520, -0.1990), ("Harrow", "HA1", 51.5800, -0.3420),
    ("Chesham", "HP5", 51.7050, -0.6110), ("Amersham", "HP6", 51.6750, -0.6070), ("Leighton Buzzard", "LU7", 51.9160, -0.6610),
]
STREETS = ["High Street", "Marlowes", "London Road", "Station Road", "Market Square", "The Parade", "Queensway", "Church Street", "Bridge Street", "Victoria Road"]

CATEGORIES = {
    "Nails": {
        "names": ["{adj} Nails", "{adj} Nail Studio", "Nail Bar {town}", "{adj} Nails & Beauty", "The Polished Room", "Gloss & Co", "Lacquer Lounge", "Velvet Nail Lounge"],
        "adj": ["Blush", "Luxe", "Pearl", "Ivory", "Rose", "Opal", "Coral", "Satin"],
        "desc": [
            "Boutique nail studio specialising in gel, BIAB and hand-painted nail art. Walk-ins welcome when we have space, bookings recommended at weekends.",
            "Friendly neighbourhood nail bar with a focus on nail health: careful prep, quality products and no rushed appointments.",
            "Modern studio offering manicures, pedicures and intricate nail art in a calm, bright space. Vegan and HEMA-free gel available.",
        ],
        "services": [("Gel Manicure", 60, 32, 42), ("BIAB Manicure", 75, 38, 48), ("Classic Manicure", 45, 22, 28), ("Luxury Pedicure", 60, 35, 45),
                     ("Gel Pedicure", 60, 34, 42), ("Nail Art (per nail)", 10, 2, 4), ("Acrylic Full Set", 90, 45, 60), ("Infills", 60, 30, 40), ("Gel Removal", 20, 8, 12)],
        "titles": ["Nail Technician", "Senior Nail Artist", "Nail Artist"],
        "cover_q": ["nail salon interior", "manicure table salon"], "portrait_q": ["nail technician portrait woman", "beautician portrait smiling"],
        "portfolio_q": ["nail art", "gel manicure", "pedicure nails", "acrylic nails design"],
        "review_bits": ["my nails have never looked this good", "the BIAB set lasted four weeks without a chip", "beautiful nail art, exactly like the photo I showed",
                        "very gentle on cuticles", "lovely calm studio", "quick but never rushed", "colour choice is huge", "booked again before I left", "shape is perfectly even on every nail", "the gel removal was gentle, no damage", "did a tricky French tip without blinking", "salon smells lovely, not of chemicals", "got exactly the almond shape I asked for", "two weeks in and still glossy"],
    },
    "Hair & Beauty": {
        "names": ["{adj} Hair Studio", "{adj} Hair & Beauty", "Salon {adj}", "{town} Hair Lounge", "Strand & Co", "The Blow Dry Room", "Mane Atelier", "Tress & Tone"],
        "adj": ["Aurora", "Mirra", "Juniper", "Willow", "Halo", "Ember", "Sage", "Lumen"],
        "desc": [
            "Independent hair salon for cuts, colour and styling. We take time for a proper consultation so you leave with hair that suits you, not a trend.",
            "Colour specialists with a love for balayage, lived-in blondes and glossy brunettes. Beauty treatments available in our quiet back room.",
            "Relaxed, music-filled salon doing precision cuts, bridal styling and keratin treatments for all hair types and textures.",
        ],
        "services": [("Women's Cut & Finish", 60, 45, 65), ("Men's Cut", 30, 22, 30), ("Full Head Colour", 120, 75, 110), ("Balayage", 180, 140, 190),
                     ("Half Head Highlights", 120, 85, 115), ("Blow Dry", 45, 28, 38), ("Toner & Gloss", 45, 30, 40), ("Keratin Treatment", 150, 150, 220), ("Eyebrow Shape & Tint", 30, 18, 25)],
        "titles": ["Senior Stylist", "Colour Technician", "Stylist", "Creative Director"],
        "cover_q": ["hair salon interior", "hairdresser salon chair"], "portrait_q": ["hairstylist portrait", "hairdresser woman portrait smiling"],
        "portfolio_q": ["balayage hair", "hairstyle woman", "hair color salon", "blow dry hairstyle"],
        "review_bits": ["best colour I've had in years", "finally someone who listens to what I want", "the balayage blends perfectly", "great consultation before touching my hair",
                        "lovely head massage at the basin", "my curls have never been cut so well", "left feeling a million dollars", "worth every penny", "the fringe is finally right", "toner knocked out all the brass", "explained aftercare without upselling", "my hair feels healthier, not just looks it", "bridal trial was relaxed and thorough", "got my grey covered seamlessly"],
    },
    "Barber": {
        "names": ["{adj} Barbers", "{town} Barber Co.", "The {adj} Chair", "{adj} & Blade", "Kings Row Barbers", "Fade Society", "Northern Cut Barbershop", "Chapter One Barbers"],
        "adj": ["Iron", "Oak", "Copper", "Anchor", "Crown", "Ledger", "Harbour", "Granite"],
        "desc": [
            "Traditional barbershop with a modern edge: skin fades, scissor cuts, hot towel shaves and beard sculpting. Good coffee while you wait.",
            "Appointment-only barbers so you're never stuck in a queue. Classic and contemporary cuts, beard work and grey blending.",
            "Family-run barbershop that has been cutting hair for three generations. Kids welcome, students get a discount on weekdays.",
        ],
        "services": [("Skin Fade", 45, 24, 32), ("Scissor Cut", 45, 22, 30), ("Cut & Beard Trim", 60, 32, 42), ("Beard Sculpt", 30, 15, 22),
                     ("Hot Towel Shave", 45, 25, 35), ("Kids Cut (under 12)", 30, 14, 18), ("Grey Blending", 30, 20, 28), ("Buzz Cut", 20, 14, 18)],
        "titles": ["Master Barber", "Barber", "Senior Barber"],
        "cover_q": ["barbershop interior", "barber shop chair"], "portrait_q": ["barber portrait man", "barber smiling portrait"],
        "portfolio_q": ["fade haircut men", "beard trim barber", "men hairstyle", "classic barber haircut"],
        "review_bits": ["sharpest fade in town", "takes his time with the beard line-up", "no queue, straight in the chair", "great chat and an even better cut",
                        "my son actually sits still here", "hot towel shave was a treat", "consistent every single time", "fair prices for the quality", "neck shave was spotless", "remembered how I had it last time", "kids area kept my daughter busy", "clean shop, sharp tools", "the taper blends like a photo", "in and out in half an hour"],
    },
    "Spa & Wellness": {
        "names": ["{adj} Spa", "{adj} Wellness Rooms", "The {adj} Retreat", "{town} Day Spa", "Stillwater Spa", "Calma Massage Studio", "Lotus Room", "Haven Wellness"],
        "adj": ["Serene", "Tranquil", "Verdant", "Ocean", "Amber", "Cedar", "Linden", "Mellow"],
        "desc": [
            "Small day spa offering Swedish, deep-tissue and hot-stone massage plus results-driven facials. Each treatment starts with a short consultation.",
            "Massage and skincare studio for people who need to switch off. Low lighting, warm beds and therapists who really know anatomy.",
            "Holistic wellness rooms: massage, reflexology, facials and lash & brow treatments, all in a quiet converted townhouse.",
        ],
        "services": [("Swedish Massage 60", 60, 55, 70), ("Deep Tissue Massage 60", 60, 60, 78), ("Hot Stone Massage 75", 75, 70, 90), ("Back, Neck & Shoulders 30", 30, 32, 42),
                     ("Signature Facial", 60, 55, 75), ("Express Facial", 30, 32, 40), ("Reflexology", 45, 40, 52), ("Lash Lift & Tint", 60, 45, 58)],
        "titles": ["Massage Therapist", "Senior Therapist", "Facialist", "Holistic Therapist"],
        "cover_q": ["spa interior massage room", "spa treatment room candles"], "portrait_q": ["massage therapist portrait", "spa therapist woman portrait"],
        "portfolio_q": ["massage therapy", "facial treatment spa", "spa stones towels", "relaxing spa"],
        "review_bits": ["the deep tissue sorted my shoulders out", "most relaxing hour of my month", "found knots I didn't know I had", "beautiful calm space",
                        "my skin was glowing after the facial", "perfect pressure, checked in without breaking the mood", "left floating", "booked a monthly slot", "heated bed on a cold day, bliss", "didn't chat unless I did", "my skin stayed calm after the facial", "reflexology had me asleep in minutes", "explained what she found in my back", "the hot stones were heaven"],
    },
}

FIRST_F = ["Emma", "Olivia", "Sophie", "Amelia", "Isla", "Mia", "Grace", "Freya", "Zara", "Leah", "Hannah", "Chloe", "Aleksandra", "Kasia", "Ioana", "Andreea",
           "Oksana", "Daria", "Linh", "Thao", "Priya", "Aisha", "Maria", "Elena", "Yuki", "Sara", "Beatriz", "Nia", "Jasmine", "Rosa"]
FIRST_M = ["Jack", "Oliver", "Harry", "Tom", "Dan", "Luca", "Marco", "Mateusz", "Andrei", "Dmytro", "Kofi", "Ahmed", "Ali", "Ravi", "Jamie", "Callum", "Theo", "Leon"]
LAST = ["Walker", "Hughes", "Bennett", "Khan", "Nowak", "Popescu", "Kovalenko", "Nguyen", "Patel", "Okafor", "Costa", "Rossi", "Fischer", "Murphy", "Ahmed", "Tanaka",
        "Novak", "Silva", "Dubois", "Evans", "Clarke", "Reid", "Mason", "Osei"]
NATIONALITY = {"Aleksandra": "Polish", "Kasia": "Polish", "Mateusz": "Polish", "Ioana": "Romanian", "Andreea": "Romanian", "Andrei": "Romanian", "Oksana": "Ukrainian",
               "Daria": "Ukrainian", "Dmytro": "Ukrainian", "Linh": "Vietnamese", "Thao": "Vietnamese", "Priya": "Indian", "Ravi": "Indian", "Aisha": "British",
               "Ahmed": "British", "Ali": "Turkish", "Maria": "Spanish", "Elena": "Italian", "Luca": "Italian", "Marco": "Italian", "Yuki": "Japanese",
               "Beatriz": "Portuguese", "Kofi": "Ghanaian", "Nia": "British", "Rosa": "Spanish"}
BIOS = [
    "{title} with {yrs} years behind the chair. Trained in {city}, obsessed with clean finishes and happy clients.",
    "{yrs} years in the industry and still learning something every week. Specialises in {spec}.",
    "Started as a Saturday junior, now a {title}. Known for {spec} and a very good cup of tea.",
    "Award-nominated {title}. Loves {spec}; dislikes rushing. Book a consultation first if you're unsure what you want.",
    "{title} who believes small details make the difference. {yrs} years' experience, {spec} a speciality.",
]
SPECS = {"Nails": ["intricate nail art", "natural-look BIAB", "long-lasting gel", "nail health and restoration"],
         "Hair & Beauty": ["lived-in blondes", "curly cuts", "bridal styling", "vivid colour"],
         "Barber": ["skin fades", "classic scissor work", "beard design", "textured crops"],
         "Spa & Wellness": ["deep-tissue work", "pre-natal massage", "glow facials", "sports recovery"]}
CLIENT_NAMES = ["Sarah M.", "James T.", "Amy", "Priya", "Chris B.", "Laura", "Tom H.", "Nadia", "Ellie", "Mark", "Hollie", "Dev", "Rachel W.", "Ben", "Kate",
                "Jess", "Sam", "Aaron", "Megan", "Lucy P.", "Omar", "Danielle", "Georgia", "Ryan"]
OPENERS = ["Honestly", "Really pleased —", "Second visit and", "Can't fault it:", "Five stars,", "Lovely experience,", "Booked last minute and", "Great find —", "Solid 4/5,", "Recommended by a friend and"]

# ───────────────────────────── Pexels ─────────────────────────────

class Pexels:
    def __init__(self, key: str | None, upload: bool):
        self.key, self.upload = key, upload
        self.cache: dict[str, list[dict]] = {}
        self.used: set[int] = set()
        self.http = httpx.Client(timeout=30)

    def _search(self, q: str) -> list[dict]:
        if q not in self.cache:
            if not self.key:
                self.cache[q] = []
            else:
                r = self.http.get("https://api.pexels.com/v1/search", params={"query": q, "per_page": 80, "orientation": "square" if "portrait" in q else "landscape"},
                                  headers={"Authorization": self.key})
                r.raise_for_status()
                self.cache[q] = r.json().get("photos", [])
                time.sleep(0.3)
        return self.cache[q]

    def photo(self, queries: list[str], size: str = "large", max_px: int = 1200) -> tuple[str | None, str]:
        """Return (url, credit). url is our S3 copy when uploading, else the Pexels CDN url. Falls back to a neutral placeholder."""
        random.shuffle(queries)
        for q in queries:
            for p in self._search(q):
                if p["id"] in self.used:
                    continue
                self.used.add(p["id"])
                credit = f"Photo: {p.get('photographer', 'Pexels')} / Pexels"
                src = p["src"].get(size) or p["src"]["large"]
                if not self.upload:
                    return src, credit
                try:
                    from app.modules.uploads.router import _upload_to_s3
                    content = self.http.get(src).content
                    return _upload_to_s3(content, f"demo-{p['id']}.jpg", max_px), credit
                except Exception as e:  # noqa: BLE001
                    print(f"   ! upload failed for {p['id']}: {e} — using Pexels URL")
                    return src, credit
        return f"https://picsum.photos/seed/{random.randint(1, 10**6)}/800/600", "Placeholder image"


# ───────────────────────────── helpers ─────────────────────────────

def wipe(db) -> None:
    print("🧹 Removing sample data…")
    db.execute(text("DELETE FROM reviews WHERE is_demo = true"))
    db.execute(text("DELETE FROM professional_photos WHERE professional_id IN (SELECT id FROM professionals WHERE is_demo = true)"))
    db.execute(text("DELETE FROM service_providers WHERE provider_id IN (SELECT id FROM providers WHERE is_demo = true)"))
    db.execute(text("DELETE FROM services WHERE description LIKE '%[sample]%'"))
    db.execute(text("DELETE FROM professional_providers WHERE provider_id IN (SELECT id FROM providers WHERE is_demo = true)"))
    db.execute(text("DELETE FROM professionals WHERE is_demo = true"))
    db.execute(text("DELETE FROM providers WHERE is_demo = true"))
    db.execute(text(f"DELETE FROM users WHERE email LIKE '%.{DEMO_DOMAIN}'"))
    db.commit()
    print("   ✓ done")


def pick_name(cat: dict, town: str, taken: set[str]) -> str:
    for _ in range(50):
        n = random.choice(cat["names"]).format(adj=random.choice(cat["adj"]), town=town)
        if n not in taken:
            taken.add(n)
            return n
    return f"{random.choice(cat['adj'])} Studio {len(taken)}"


def review_text(cat: dict, pro_first: str, rating: int) -> str:
    bits = random.sample(cat["review_bits"], 2)
    shape = random.randint(0, 3)
    adj = random.choice(["brilliant", "so professional", "friendly and quick", "patient and precise", "a real expert", "lovely", "really skilled"])
    if shape == 0:
        s = f"{random.choice(OPENERS)} {bits[0]}. {pro_first} was {adj} and {bits[1]}."
    elif shape == 1:
        s = f"{pro_first} was {adj} — {bits[0]}. {bits[1][0].upper() + bits[1][1:]}."
    elif shape == 2:
        s = f"{bits[0][0].upper() + bits[0][1:]}. {bits[1][0].upper() + bits[1][1:]}. Thanks {pro_first}!"
    else:
        s = f"{random.choice(OPENERS)} {bits[0]} and {bits[1]}. Will be back."
    if rating == 4:
        s += random.choice([" Only niggle: parking is tricky.", " Slightly over time, but worth it.", " A touch pricey, hence four stars."])
    return s[0].upper() + s[1:]


# ───────────────────────────── main ─────────────────────────────

def run(n_salons: int, pexels: Pexels, dry: bool) -> None:
    db = SessionLocal()
    try:
        pwd = hash_password("Sample-" + os.urandom(6).hex())
        taken: set[str] = set()
        cats = list(CATEGORIES.items())
        towns = TOWNS[:]
        random.shuffle(towns)
        total_pros = total_reviews = 0
        for i in range(n_salons):
            cat_name, cat = cats[i % len(cats)]
            town, pc, lat, lng = towns[i % len(towns)]
            name = pick_name(cat, town, taken)
            slug = "".join(ch for ch in name.lower() if ch.isalnum())
            print(f"🏪 {i + 1}/{n_salons} {name} — {cat_name}, {town}")
            if dry:
                continue
            logo, _ = pexels.photo(cat["cover_q"][:], "large", 1000)
            prov = Provider(
                name=name, category=cat_name, description=random.choice(cat["desc"]),
                address=f"{random.randint(2, 120)} {random.choice(STREETS)}, {town}, {pc} {random.randint(1, 9)}{random.choice('ABDEFGHJLNPQRSTUWXYZ')}{random.choice('ABDEFGHJLNPQRSTUWXYZ')}, UK",
                phone=f"+441442{random.randint(100000, 999999)}", email=f"hello@{slug}.{DEMO_DOMAIN}",
                logo_url=logo, latitude=lat + random.uniform(-0.01, 0.01), longitude=lng + random.uniform(-0.01, 0.01),
                is_active=True, is_demo=True, worker_payment_amount=0.0, deposit_percentage=10.0,
                settings={"sample": True, "opening_hours": "Mon–Sat 9:00–18:00"},
            )
            db.add(prov); db.flush()

            owner = User(email=f"owner@{slug}.{DEMO_DOMAIN}", hashed_password=pwd, role=UserRole.PROVIDER_OWNER, name=f"{name} (sample owner)", is_active=False, is_verified=True)
            db.add(owner); db.flush()
            db.add(ProviderOwner(user_id=owner.id, provider_id=prov.id))

            services = []
            for svc_name, mins, lo, hi in random.sample(cat["services"], k=min(len(cat["services"]), random.randint(6, 8))):
                svc = Service(name=svc_name, description=f"{svc_name} at {name}. [sample]", duration_minutes=mins, price=round(random.uniform(lo, hi) / 0.5) * 0.5, is_active=True)
                svc.providers.append(prov)
                db.add(svc); services.append(svc)

            n_pros = random.randint(3, 5)
            for _ in range(n_pros):
                female = random.random() < (0.15 if cat_name == "Barber" else 0.8)
                first = random.choice(FIRST_F if female else FIRST_M); last = random.choice(LAST)
                yrs = random.randint(2, 18); title = random.choice(cat["titles"])
                avatar, _ = pexels.photo([q + (" woman" if female and "woman" not in q else "") for q in cat["portrait_q"]], "medium", 600)
                u = User(email=f"{first.lower()}.{last.lower()}{random.randint(10, 99)}@{slug}.{DEMO_DOMAIN}", hashed_password=pwd, role=UserRole.PROFESSIONAL,
                         name=f"{first} {last}", is_active=False, is_verified=True)
                db.add(u); db.flush()
                pro = Professional(
                    user_id=u.id, name=f"{first} {last}", avatar_url=avatar, nationality=NATIONALITY.get(first, "British"), experience_years=yrs,
                    bio=random.choice(BIOS).format(title=title, yrs=yrs, city={"Polish": "Warsaw", "Romanian": "Bucharest", "Ukrainian": "Kyiv", "Italian": "Milan", "Spanish": "Madrid", "Vietnamese": "Hanoi", "Indian": "Mumbai", "Japanese": "Tokyo", "Portuguese": "Lisbon", "Turkish": "Istanbul", "Ghanaian": "Accra"}.get(NATIONALITY.get(first, "British"), random.choice(["London", "Manchester", "Birmingham", "Brighton"])), spec=random.choice(SPECS[cat_name]))[:1000],
                    description=f"{title} at {name}. Sample profile for demonstration.", social_links={"title": title, "sample": True}, is_demo=True,
                )
                db.add(pro); db.flush()
                db.add(ProfessionalProvider(professional_id=pro.id, provider_id=prov.id, status=ProfessionalStatus.ACTIVE, joined_at=datetime.utcnow() - timedelta(days=random.randint(60, 900))))
                for k in range(random.randint(3, 5)):
                    url, credit = pexels.photo(cat["portfolio_q"][:], "large", 1200)
                    db.add(ProfessionalPhoto(professional_id=pro.id, image_url=url, caption=credit, order=k))
                for _ in range(random.randint(3, 8)):
                    rating = random.choices([5, 4, 3], weights=[70, 25, 5])[0]
                    db.add(Review(professional_id=pro.id, provider_id=prov.id, client_name=random.choice(CLIENT_NAMES), rating=rating,
                                  comment=review_text(cat, first, rating), images=[], is_published=True, is_demo=True,
                                  created_at=datetime.utcnow() - timedelta(days=random.randint(3, 400))))
                    total_reviews += 1
                total_pros += 1
            db.commit()
        print(f"\n✅ {n_salons} sample salons, {total_pros} professionals, {total_reviews} reviews{' (dry run)' if dry else ''}")
    finally:
        db.close()


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--salons", type=int, default=20)
    ap.add_argument("--wipe", action="store_true", help="remove all sample data and exit")
    ap.add_argument("--dry-run", action="store_true")
    ap.add_argument("--no-upload", action="store_true", help="link Pexels URLs directly instead of copying photos to S3")
    args = ap.parse_args()
    if args.wipe:
        wipe(SessionLocal()); sys.exit(0)
    key = os.environ.get("PEXELS_API_KEY")
    if not key and not args.dry_run:
        print("PEXELS_API_KEY not set — photos will be neutral placeholders. Get a free key at https://www.pexels.com/api/")
    run(args.salons, Pexels(key, upload=not args.no_upload), args.dry_run)
