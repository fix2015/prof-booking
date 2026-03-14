# API Reference

Base URL: `http://localhost:8000/api/v1`
Interactive docs: `http://localhost:8000/docs` (development only)

## Authentication

All protected endpoints require:
```
Authorization: Bearer <access_token>
```

---

## Auth

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/auth/login` | No | Login with email + password |
| POST | `/auth/register/owner` | No | Register salon owner |
| POST | `/auth/register/master` | No | Register master (with optional invite) |
| POST | `/auth/refresh` | No | Refresh access token |
| POST | `/auth/logout` | Yes | Revoke all refresh tokens |

### Login
```json
POST /auth/login
{ "email": "owner@salon.com", "password": "pass" }

→ {
  "access_token": "eyJ...",
  "refresh_token": "...",
  "token_type": "bearer",
  "user_id": 1,
  "role": "salon_owner"
}
```

### Register Owner
```json
POST /auth/register/owner
{
  "email": "owner@salon.com",
  "phone": "+1234567890",
  "password": "securepass",
  "salon_name": "My Nail Salon",
  "salon_address": "123 Main St",
  "worker_payment_amount": 50.0
}
```

---

## Salons

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/salons/public` | No | List all active salons |
| GET | `/salons/public/:id` | No | Get salon by ID |
| GET | `/salons/:id` | Owner | Get full salon data |
| PATCH | `/salons/:id` | Owner | Update salon |

---

## Services

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/services/salon/:id` | No | List salon services |
| POST | `/services/salon/:id` | Owner | Create service |
| PATCH | `/services/:id` | Owner | Update service |
| DELETE | `/services/:id` | Owner | Deactivate service |

---

## Masters

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/masters/me` | Master | Get own profile |
| PATCH | `/masters/me` | Master | Update own profile |
| GET | `/masters/salon/:id/public` | No | List active masters (public) |
| GET | `/masters/salon/:id` | Owner | List all masters with status |
| PATCH | `/masters/salon/:id/:mid/approval` | Owner | Approve/reject master |

---

## Calendar

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/calendar/availability` | No | Get available booking slots |
| GET | `/calendar/slots/my` | Master | Get own work slots |
| POST | `/calendar/slots` | Master | Add work slot |
| DELETE | `/calendar/slots/:id` | Master | Remove work slot |
| POST | `/calendar/slots/copy-week` | Master | Copy weekly schedule |

### Availability Query
```
GET /calendar/availability?salon_id=1&date=2026-03-15&duration_minutes=60
→ [
  {
    "master_id": 2,
    "master_name": "Jane",
    "slot_date": "2026-03-15",
    "start_time": "09:00:00",
    "end_time": "10:00:00",
    "work_slot_id": 5
  }
]
```

---

## Booking (Public)

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/booking/` | No | Create booking |

### Create Booking
```json
POST /booking/
{
  "salon_id": 1,
  "service_id": 2,
  "master_id": 3,
  "client_name": "Jane Doe",
  "client_phone": "+1234567890",
  "client_email": "jane@example.com",
  "starts_at": "2026-03-15T10:00:00"
}

→ {
  "session_id": 42,
  "client_name": "Jane Doe",
  "salon_name": "My Nail Salon",
  "service_name": "Manicure",
  "starts_at": "2026-03-15T10:00:00",
  "ends_at": "2026-03-15T11:00:00",
  "price": 30.0,
  "confirmation_code": "A1B2C3D4"
}
```

---

## Sessions

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/sessions/` | Master/Owner | List sessions (with filters) |
| GET | `/sessions/today` | Master | Today's sessions |
| GET | `/sessions/:id` | Master/Owner | Get session |
| PATCH | `/sessions/:id` | Master/Owner | Update status |
| POST | `/sessions/:id/earnings` | Master/Owner | Record earnings |

---

## Payments

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/payments/checkout` | No | Create Stripe checkout |
| POST | `/payments/webhook` | No | Stripe webhook receiver |
| GET | `/payments/session/:id` | Yes | Get payment for session |

---

## Reports

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/reports/salon/:id` | Owner | Full salon analytics |
| GET | `/reports/master/me` | Master | My earnings report |
| GET | `/reports/master/:id` | Owner | Master report |

Query params: `date_from=YYYY-MM-DD&date_to=YYYY-MM-DD`

---

## Invites

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/invites/validate/:token` | No | Validate invite token |
| GET | `/invites/salon/:id` | Owner | List salon invites |
| POST | `/invites/salon/:id` | Owner | Send invite email |
| DELETE | `/invites/:id/salon/:sid` | Owner | Revoke invite |

---

## Error Responses

| Code | Meaning |
|------|---------|
| 400 | Bad request / validation error |
| 401 | Unauthorized — missing or invalid token |
| 403 | Forbidden — insufficient role |
| 404 | Resource not found |
| 409 | Conflict (duplicate email, time slot overlap) |
| 422 | Unprocessable entity (Pydantic validation) |
| 502 | External service error (Stripe, Twilio) |
