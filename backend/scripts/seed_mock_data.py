"""
Seed script: 10 providers + 200 professionals near Hemel Hempstead (100-mile radius).
Run inside backend container: python scripts/seed_mock_data.py
"""
import os
import sys
import random
from datetime import datetime, date, time, timedelta

sys.path.insert(0, "/app")
os.environ.setdefault("APP_SECRET_KEY", os.environ.get("APP_SECRET_KEY", "seed"))
os.environ.setdefault("JWT_SECRET_KEY", os.environ.get("JWT_SECRET_KEY", "seed"))

from app.database import SessionLocal
from app.modules.salons.models import Provider
from app.modules.masters.models import Professional, ProfessionalProvider, ProfessionalStatus
from app.modules.users.models import User, UserRole
from app.modules.services.models import Service
from app.modules.calendar.models import WorkSlot

# ── Static data ────────────────────────────────────────────────────────────────

PROVIDERS = [
    {"name": "Glam Nail Studio", "city": "Hemel Hempstead", "postcode": "HP1 1BL", "lat": 51.7526, "lng": -0.4421, "street": "Marlowes 12"},
    {"name": "Luxe Beauty Lounge", "city": "St Albans", "postcode": "AL1 3LD", "lat": 51.7520, "lng": -0.3360, "street": "London Road 45"},
    {"name": "Pink Petal Nails", "city": "Watford", "postcode": "WD17 2AA", "lat": 51.6565, "lng": -0.3903, "street": "High Street 88"},
    {"name": "The Nail Bar", "city": "Luton", "postcode": "LU1 2TL", "lat": 51.8787, "lng": -0.4200, "street": "George Street 23"},
    {"name": "Serenity Spa & Nails", "city": "Milton Keynes", "postcode": "MK9 3LA", "lat": 52.0406, "lng": -0.7594, "street": "Midsummer Boulevard 67"},
    {"name": "Blossom Beauty", "city": "Oxford", "postcode": "OX1 1BP", "lat": 51.7520, "lng": -1.2577, "street": "Queen Street 14"},
    {"name": "Crystal Nails & Spa", "city": "Northampton", "postcode": "NN1 2HT", "lat": 52.2405, "lng": -0.8937, "street": "Abington Street 31"},
    {"name": "Elite Nail Studio", "city": "Cambridge", "postcode": "CB2 3AG", "lat": 52.2053, "lng": 0.1218, "street": "Hills Road 5"},
    {"name": "Pure Nails Salon", "city": "Bedford", "postcode": "MK40 1RL", "lat": 52.1360, "lng": -0.4667, "street": "Midland Road 19"},
    {"name": "Aura Beauty Hub", "city": "Aylesbury", "postcode": "HP20 1SJ", "lat": 51.8152, "lng": -0.8098, "street": "Market Square 7"},
]

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

SERVICES = [
    ("Gel Manicure", 60, 45.0),
    ("Acrylic Full Set", 90, 65.0),
    ("Gel Pedicure", 60, 50.0),
    ("Nail Art Design", 30, 25.0),
    ("Dip Powder Manicure", 75, 55.0),
    ("French Manicure", 60, 40.0),
    ("Shellac Manicure", 60, 42.0),
    ("Nail Extensions", 120, 80.0),
    ("Paraffin Wax Treatment", 30, 30.0),
    ("Classic Manicure", 45, 30.0),
    ("Classic Pedicure", 45, 35.0),
    ("Nail Removal", 30, 20.0),
    ("Nail Repair", 15, 10.0),
    ("Infill Acrylic", 60, 45.0),
    ("Chrome Powder Nails", 75, 60.0),
    ("Ombre Nails", 90, 70.0),
    ("Builder Gel Overlay", 75, 55.0),
    ("Cuticle Care Treatment", 20, 15.0),
    ("3D Nail Art", 45, 35.0),
    ("Luxury Manicure & Spa", 90, 75.0),
]

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
LOGO_BASE = "https://picsum.photos/seed/{seed}/200/200"


def hash_password(password: str) -> str:
    from passlib.context import CryptContext
    ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
    return ctx.hash(password)


def random_slots(professional_id: int, provider_id: int, count: int = 50):
    slots = []
    today = date.today()
    used = set()
    attempts = 0
    while len(slots) < count and attempts < count * 3:
        attempts += 1
        day_offset = random.randint(1, 60)
        slot_date = today + timedelta(days=day_offset)
        hour = random.choice([9, 10, 11, 12, 13, 14, 15, 16, 17])
        key = (slot_date, hour)
        if key in used:
            continue
        used.add(key)
        start = time(hour, 0)
        end = time(hour + 1, 0)
        slots.append(WorkSlot(
            professional_id=professional_id,
            provider_id=provider_id,
            slot_date=slot_date,
            start_time=start,
            end_time=end,
            is_available=True,
            created_at=datetime.utcnow(),
        ))
    return slots


def run():
    db = SessionLocal()
    try:
        print("🏪 Creating 10 providers...")
        providers = []
        for i, p in enumerate(PROVIDERS):
            address = f"{p['street']}, {p['city']}, {p['postcode']}, UK"
            prov = Provider(
                name=p["name"],
                address=address,
                phone=f"+44 1442 {100000 + i * 7919:06d}"[:16],
                email=f"info@{p['name'].lower().replace(' ', '').replace('&', '')}nail.co.uk",
                description=f"Premier nail salon in {p['city']} offering a full range of nail and beauty services.",
                logo_url=LOGO_BASE.format(seed=p["name"].replace(" ", "")),
                category="Beauty & Nails",
                latitude=p["lat"] + random.uniform(-0.005, 0.005),
                longitude=p["lng"] + random.uniform(-0.005, 0.005),
                is_active=True,
                worker_payment_amount=0.0,
                deposit_percentage=10.0,
            )
            db.add(prov)
            db.flush()
            providers.append(prov)

            # Add 10-15 services per provider
            for svc_name, duration, price in random.sample(SERVICES, 12):
                db.add(Service(
                    provider_id=prov.id,
                    name=svc_name,
                    duration_minutes=duration,
                    price=round(price + random.uniform(-5, 10), 2),
                    is_active=True,
                    created_at=datetime.utcnow(),
                ))

        db.flush()
        print(f"  ✓ {len(providers)} providers created")

        print("👩 Creating 200 professionals...")
        pwd_hash = hash_password("Password123!")
        professionals = []
        names_used = set()

        for i in range(200):
            # Unique name
            for _ in range(20):
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

            avatar_idx = (i % 70) + 1
            prof = Professional(
                user_id=user.id,
                name=full_name,
                phone=f"+44 7{700000000 + i:09d}"[:13],
                bio=random.choice(BIOS),
                avatar_url=f"{AVATAR_BASE}{avatar_idx}",
                nationality=random.choice(NATIONALITIES),
                experience_years=random.randint(1, 15),
                description=f"Professional nail technician based in the UK. {random.choice(BIOS)}",
                is_independent=False,
                created_at=datetime.utcnow(),
            )
            db.add(prof)
            db.flush()
            professionals.append(prof)

        db.flush()
        print(f"  ✓ {len(professionals)} professionals created")

        print("🔗 Linking professionals to providers + adding services + slots...")
        for i, prof in enumerate(professionals):
            # Each professional works at 1-2 providers
            num_providers = random.randint(1, 2)
            assigned_providers = random.sample(providers, num_providers)

            for prov in assigned_providers:
                pp = ProfessionalProvider(
                    professional_id=prof.id,
                    provider_id=prov.id,
                    status=ProfessionalStatus.ACTIVE,
                    payment_amount=round(random.uniform(50, 150), 2),
                    joined_at=datetime.utcnow() - timedelta(days=random.randint(30, 365)),
                    created_at=datetime.utcnow(),
                )
                db.add(pp)
                db.flush()

                # 50 calendar slots per professional per provider
                slots = random_slots(prof.id, prov.id, 50)
                for s in slots:
                    db.add(s)

            # 5-10 services linked to their first provider (add personal services)
            main_provider = assigned_providers[0]
            num_services = random.randint(5, 10)
            chosen_services = random.sample(SERVICES, num_services)
            for svc_name, duration, price in chosen_services:
                # Check if this service name already exists for this provider
                existing = db.query(Service).filter(
                    Service.provider_id == main_provider.id,
                    Service.name == svc_name,
                ).first()
                if not existing:
                    db.add(Service(
                        provider_id=main_provider.id,
                        name=svc_name,
                        duration_minutes=duration,
                        price=round(price + random.uniform(-5, 10), 2),
                        is_active=True,
                        created_at=datetime.utcnow(),
                    ))

            if (i + 1) % 20 == 0:
                db.flush()
                print(f"  ... {i + 1}/200 done")

        db.commit()
        print("\n✅ Done!")
        print(f"  Providers : {len(providers)}")
        print(f"  Professionals: {len(professionals)}")
        print(f"  Slots ~{len(professionals) * 50:,} work slots inserted")
        print("  Credentials : <email> / Password123!")

    except Exception as e:
        db.rollback()
        raise e
    finally:
        db.close()


if __name__ == "__main__":
    run()
