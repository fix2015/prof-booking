"""
Seed script: 10 providers + 200 professionals near Hemel Hempstead (100-mile radius).
Skills (5-10 per professional) stored in social_links JSON field.
Run: cd backend && python scripts/seed_mock_data.py
"""
import os
import sys
import random
from datetime import datetime, date, time, timedelta

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
os.environ.setdefault("APP_SECRET_KEY", os.environ.get("APP_SECRET_KEY", "seed"))
os.environ.setdefault("JWT_SECRET_KEY", os.environ.get("JWT_SECRET_KEY", "seed"))

from app.database import SessionLocal

# Import all modules so SQLAlchemy can resolve every relationship

from app.modules.salons.models import Provider
from app.modules.masters.models import Professional, ProfessionalProvider, ProfessionalStatus
from app.modules.users.models import User, UserRole
from app.modules.services.models import Service
from app.modules.calendar.models import WorkSlot

# ── Providers (all within ~100 miles of Hemel Hempstead HP1) ───────────────

PROVIDERS = [
    {"name": "Glam Nail Studio",      "city": "Hemel Hempstead", "postcode": "HP1 1BL", "lat": 51.7526, "lng": -0.4421, "street": "12 Marlowes"},
    {"name": "Luxe Beauty Lounge",    "city": "St Albans",        "postcode": "AL1 3LD", "lat": 51.7520, "lng": -0.3360, "street": "45 London Road"},
    {"name": "Pink Petal Nails",      "city": "Watford",          "postcode": "WD17 2AA","lat": 51.6565, "lng": -0.3903, "street": "88 High Street"},
    {"name": "The Nail Bar",          "city": "Luton",            "postcode": "LU1 2TL", "lat": 51.8787, "lng": -0.4200, "street": "23 George Street"},
    {"name": "Serenity Spa & Nails",  "city": "Milton Keynes",    "postcode": "MK9 3LA", "lat": 52.0406, "lng": -0.7594, "street": "67 Midsummer Boulevard"},
    {"name": "Blossom Beauty",        "city": "Oxford",           "postcode": "OX1 1BP", "lat": 51.7520, "lng": -1.2577, "street": "14 Queen Street"},
    {"name": "Crystal Nails & Spa",   "city": "Northampton",      "postcode": "NN1 2HT", "lat": 52.2405, "lng": -0.8937, "street": "31 Abington Street"},
    {"name": "Elite Nail Studio",     "city": "Cambridge",        "postcode": "CB2 3AG", "lat": 52.2053, "lng":  0.1218, "street": "5 Hills Road"},
    {"name": "Pure Nails Salon",      "city": "Bedford",          "postcode": "MK40 1RL","lat": 52.1360, "lng": -0.4667, "street": "19 Midland Road"},
    {"name": "Aura Beauty Hub",       "city": "Aylesbury",        "postcode": "HP20 1SJ","lat": 51.8152, "lng": -0.8098, "street": "7 Market Square"},
]

PROVIDER_IMGS = [
    "https://picsum.photos/seed/glamnailst/200/200",
    "https://picsum.photos/seed/luxebeauty/200/200",
    "https://picsum.photos/seed/pinkpetal/200/200",
    "https://picsum.photos/seed/thenailbar/200/200",
    "https://picsum.photos/seed/serenityspa/200/200",
    "https://picsum.photos/seed/blossombeauty/200/200",
    "https://picsum.photos/seed/crystalnails/200/200",
    "https://picsum.photos/seed/elitestudio/200/200",
    "https://picsum.photos/seed/purenails/200/200",
    "https://picsum.photos/seed/aurabeauty/200/200",
]

# ── Names ───────────────────────────────────────────────────────────────────

FIRST_NAMES = [
    "Emma","Olivia","Ava","Isabella","Sophia","Mia","Charlotte","Amelia","Harper","Evelyn",
    "Abigail","Emily","Elizabeth","Sofia","Ella","Madison","Scarlett","Victoria","Aria","Grace",
    "Chloe","Camila","Penelope","Riley","Layla","Lily","Eleanor","Hannah","Lillian","Addison",
    "Aubrey","Ellie","Stella","Natalie","Zoe","Leah","Hazel","Violet","Aurora","Savannah",
    "Audrey","Brooklyn","Bella","Claire","Skylar","Lucy","Paisley","Everly","Anna","Caroline",
    "Nova","Genesis","Emilia","Kennedy","Samantha","Maya","Willow","Kinsley","Naomi","Aaliyah",
    "Elena","Sarah","Ariana","Allison","Gabriella","Alice","Madelyn","Cora","Ruby","Eva",
    "Serenity","Autumn","Adeline","Hailey","Gianna","Valentina","Isla","Eliana","Quinn","Nevaeh",
    "Ivy","Sadie","Piper","Lydia","Alexa","Josephine","Emery","Julia","Delilah","Arianna",
    "Vivian","Kaylee","Sophie","Brielle","Madeline","Peyton","Rylee","Clara","Hadley","Melanie",
    "Mackenzie","Reagan","Adalynn","Liliana","Aubree","Jade","Katherine","Isabelle","Natalia","Raelynn",
]

LAST_NAMES = [
    "Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez",
    "Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin",
    "Lee","Perez","Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson",
    "Walker","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores",
    "Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell","Carter","Roberts",
]

NATIONALITIES = [
    "British","Polish","Romanian","Lithuanian","Slovak","Czech","Hungarian","Ukrainian","Russian",
    "Vietnamese","Chinese","Filipino","Thai","Indian","Korean","Japanese","Brazilian","Spanish",
    "Italian","French","Portuguese","German","Dutch","Turkish","Moroccan",
]

# ── Skills (25 distinct nail/beauty skills) ─────────────────────────────────

ALL_SKILLS = [
    "Gel Manicure",
    "Acrylic Full Set",
    "Gel Pedicure",
    "Nail Art Design",
    "Dip Powder Manicure",
    "French Manicure",
    "Shellac Manicure",
    "Nail Extensions",
    "Paraffin Wax Treatment",
    "Classic Manicure",
    "Classic Pedicure",
    "Nail Removal",
    "Nail Repair",
    "Infill Acrylic",
    "Chrome Powder Nails",
    "Ombre Nails",
    "Builder Gel Overlay",
    "Cuticle Care Treatment",
    "3D Nail Art",
    "Luxury Manicure & Spa",
    "Polygel Application",
    "Hard Gel Nails",
    "Russian Manicure",
    "Nail Stamping Art",
    "Encapsulated Nail Art",
]

# Services per provider (name, duration_min, base_price)
SERVICES = [(s, random.randint(20, 120), round(random.uniform(15, 85), 2)) for s in ALL_SKILLS]

BIOS = [
    "Passionate nail artist with years of experience creating stunning designs.",
    "Specialising in gel and acrylic nails with an eye for detail.",
    "Dedicated to providing luxurious nail care in a relaxing environment.",
    "Creative nail technician who loves bringing clients' vision to life.",
    "Expert in modern nail techniques with a focus on long-lasting results.",
    "Friendly and professional, making every visit a comfortable experience.",
    "Trained in the latest nail art trends and classic techniques.",
    "Committed to nail health and beautiful aesthetics.",
    "Award-winning nail artist with a passion for intricate designs.",
    "Providing premium nail services with attention to hygiene and quality.",
]

AVATAR_BASE = "https://i.pravatar.cc/300?img="


def hash_password(password: str) -> str:
    from passlib.context import CryptContext
    ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
    return ctx.hash(password)


def random_slots(professional_id: int, provider_id: int, count: int = 50):
    slots = []
    today = date.today()
    used: set = set()
    attempts = 0
    while len(slots) < count and attempts < count * 5:
        attempts += 1
        day_offset = random.randint(1, 90)
        slot_date = today + timedelta(days=day_offset)
        hour = random.choice([9, 10, 11, 12, 13, 14, 15, 16, 17])
        key = (slot_date, hour)
        if key in used:
            continue
        used.add(key)
        slots.append(WorkSlot(
            professional_id=professional_id,
            provider_id=provider_id,
            slot_date=slot_date,
            start_time=time(hour, 0),
            end_time=time(hour + 1, 0),
            is_available=True,
            created_at=datetime.utcnow(),
        ))
    return slots


def clear_existing(db) -> None:
    """Remove all previous seed data (keeps admin user)."""
    print("🧹 Clearing old seed data...")
    db.execute(__import__("sqlalchemy").text(
        "DELETE FROM work_slots"
    ))
    db.execute(__import__("sqlalchemy").text(
        "DELETE FROM professional_providers"
    ))
    db.execute(__import__("sqlalchemy").text(
        "DELETE FROM sessions WHERE provider_id IN (SELECT id FROM providers WHERE email LIKE '%probook-demo%' OR description LIKE 'Premier nail salon%')"
    ))
    db.execute(__import__("sqlalchemy").text(
        "DELETE FROM services WHERE provider_id IN (SELECT id FROM providers WHERE email LIKE '%probook-demo%' OR description LIKE 'Premier nail salon%')"
    ))
    # Delete professionals whose users have probook-demo emails
    db.execute(__import__("sqlalchemy").text(
        "DELETE FROM professional_photos WHERE professional_id IN "
        "(SELECT p.id FROM professionals p JOIN users u ON p.user_id = u.id WHERE u.email LIKE '%probook-demo%')"
    ))
    db.execute(__import__("sqlalchemy").text(
        "DELETE FROM professionals WHERE user_id IN "
        "(SELECT id FROM users WHERE email LIKE '%probook-demo%')"
    ))
    db.execute(__import__("sqlalchemy").text(
        "DELETE FROM users WHERE email LIKE '%probook-demo%'"
    ))
    db.execute(__import__("sqlalchemy").text(
        "DELETE FROM providers WHERE email LIKE '%probook-demo%' OR description LIKE 'Premier nail salon%'"
    ))
    db.flush()
    print("  ✓ Cleared")


def run():
    db = SessionLocal()
    try:
        clear_existing(db)

        # ── 1. Providers ────────────────────────────────────────────────────
        print("🏪 Creating 10 providers...")
        providers = []
        for i, p in enumerate(PROVIDERS):
            address = f"{p['street']}, {p['city']}, {p['postcode']}, UK"
            slug = p["name"].lower().replace(" ", "").replace("&", "")
            prov = Provider(
                name=p["name"],
                address=address,
                phone=f"+441442{100000 + i * 7919:06d}"[:16],
                email=f"info@{slug}-probook-demo.co.uk",
                description=f"Premier nail salon in {p['city']} offering a full range of nail and beauty services.",
                logo_url=PROVIDER_IMGS[i],
                category="Beauty & Nails",
                latitude=p["lat"] + random.uniform(-0.003, 0.003),
                longitude=p["lng"] + random.uniform(-0.003, 0.003),
                is_active=True,
                worker_payment_amount=0.0,
                deposit_percentage=10.0,
            )
            db.add(prov)
            db.flush()
            providers.append(prov)

            # All 25 services available at each provider
            for svc_name, duration, base_price in SERVICES:
                db.add(Service(
                    provider_id=prov.id,
                    name=svc_name,
                    duration_minutes=duration,
                    price=round(base_price + random.uniform(-3, 8), 2),
                    is_active=True,
                    created_at=datetime.utcnow(),
                ))

        db.flush()
        print(f"  ✓ {len(providers)} providers + {len(SERVICES) * len(providers)} services")

        # ── 2. Professionals ────────────────────────────────────────────────
        print("👩 Creating 200 professionals...")
        pwd_hash = hash_password("Password123!")
        professionals = []
        names_used: set = set()

        for i in range(200):
            # Unique full name
            fname, lname = "Jane", "Doe"
            for _ in range(30):
                fname = random.choice(FIRST_NAMES)
                lname = random.choice(LAST_NAMES)
                full_name = f"{fname} {lname}"
                if full_name not in names_used:
                    names_used.add(full_name)
                    break

            email = f"{fname.lower()}.{lname.lower()}{i}@probook-demo.com"

            user = User(
                email=email,
                hashed_password=pwd_hash,
                role=UserRole.PROFESSIONAL,
                is_active=True,
                created_at=datetime.utcnow(),
            )
            db.add(user)
            db.flush()

            # Pick 5-10 distinct skills for this professional
            num_skills = random.randint(5, 10)
            prof_skills = random.sample(ALL_SKILLS, num_skills)

            avatar_idx = (i % 70) + 1
            prof = Professional(
                user_id=user.id,
                name=f"{fname} {lname}",
                phone=f"+447{700000000 + i:09d}"[:13],
                bio=random.choice(BIOS),
                avatar_url=f"{AVATAR_BASE}{avatar_idx}",
                social_links={"skills": prof_skills},  # store skills here
                nationality=random.choice(NATIONALITIES),
                experience_years=random.randint(1, 15),
                description=(
                    f"Professional nail technician based in the UK. "
                    f"Skills: {', '.join(prof_skills)}. "
                    f"{random.choice(BIOS)}"
                ),
                is_independent=False,
                created_at=datetime.utcnow(),
            )
            db.add(prof)
            db.flush()
            professionals.append(prof)

            if (i + 1) % 50 == 0:
                db.flush()
                print(f"  ... {i + 1}/200 professionals created")

        db.flush()
        print(f"  ✓ {len(professionals)} professionals created")

        # ── 3. Link professionals ↔ providers + calendar slots ──────────────
        print("🔗 Linking professionals to providers + 50 slots each...")
        for i, prof in enumerate(professionals):
            # Each professional works at 1-2 providers
            num_provs = random.randint(1, 2)
            assigned = random.sample(providers, num_provs)

            for prov in assigned:
                pp = ProfessionalProvider(
                    professional_id=prof.id,
                    provider_id=prov.id,
                    status=ProfessionalStatus.ACTIVE,
                    payment_amount=round(random.uniform(50, 150), 2),
                    joined_at=datetime.utcnow() - timedelta(days=random.randint(30, 730)),
                    created_at=datetime.utcnow(),
                )
                db.add(pp)
                db.flush()

                # 50 calendar slots per professional per provider
                for slot in random_slots(prof.id, prov.id, 50):
                    db.add(slot)

            if (i + 1) % 50 == 0:
                db.flush()
                print(f"  ... {i + 1}/200 linked")

        db.commit()

        total_slots = db.execute(
            __import__("sqlalchemy").text("SELECT COUNT(*) FROM work_slots")
        ).scalar()

        print("\n✅ Seeding complete!")
        print(f"  Providers      : {len(providers)}")
        print(f"  Professionals  : {len(professionals)}")
        print(f"  Work slots     : {total_slots:,}")
        print("  Skills/prof    : 5-10 (stored in social_links.skills)")
        print("  Login password : Password123!")

    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    run()
