# Notification Rules

This document defines **when**, **to whom**, and **what** each in-app and push notification is sent.
All day-before reminders are triggered by the Celery beat task `send_reminders_for_tomorrow` which runs daily at midnight UTC.

---

## Notification Events

### 1. Booking Confirmed
**Trigger:** Client completes booking (`POST /api/v1/booking/`)
**Who receives:**
| Role | Message |
|------|---------|
| **Client** | "Your appointment is confirmed for [weekday], [date] at [time] with [professional_name] at [salon_name]. Code: #[confirmation_code]" |
| **Professional** | "New booking: [client_name] on [date] at [time] for [service_name]" |
| **Business Owner** | "New booking at [salon_name]: [client_name] · [service_name] · [date] [time]" |

**Channels:** SMS (Twilio) + in-app notification

---

### 2. Day-Before Reminder
**Trigger:** Celery beat runs daily; scans all `CONFIRMED` sessions with `starts_at` tomorrow
**Who receives:**
| Role | Message |
|------|---------|
| **Client** | "Reminder: Your appointment tomorrow at [time] with [professional_name] at [salon_name]. See you then! 💅" |
| **Professional** | "Tomorrow's schedule reminder: [client_name] at [time] for [service_name]" |
| **Business Owner** | "Tomorrow at [salon_name]: [N] appointments scheduled" |

**Channels:** SMS + in-app
**When:** Sent the day before at ~9:00 AM client local time (current implementation sends at task execution time)

**Implementation status:** Client reminders are sent via `task_send_booking_reminder`. Professional and owner day-before notifications are **not yet implemented** — they need to be added to `send_booking_reminder` in `notifications/services.py`.

---

### 3. Booking Cancelled
**Trigger:** Session status changes to `cancelled`
**Who receives:**
| Role | Message |
|------|---------|
| **Client** | "Your appointment on [date] at [time] has been cancelled. [reason if provided]" |
| **Professional** | "Booking cancelled: [client_name] on [date] at [time] has been cancelled" |
| **Business Owner** | "Booking cancelled at [salon_name]: [client_name] · [date] [time]" |

**Channels:** SMS + in-app

---

### 4. New Review Received
**Trigger:** Client submits a review (`POST /api/v1/reviews/`)
**Who receives:**
| Role | Message |
|------|---------|
| **Professional** | "[client_name] left a [N]/5 review ★★★★☆ — '[comment excerpt]'" |
| **Business Owner** | "New review at [salon_name]: [N]/5 stars from [client_name]" |

**Channels:** In-app only (no SMS)
**Note:** Client is **not** notified — they submitted the review.

---

### 5. Session Status Change (in_progress → completed)
**Trigger:** Professional or owner marks a session `completed`
**Who receives:**
| Role | Message |
|------|---------|
| **Client** | "Thanks for visiting [salon_name]! We'd love your feedback — [review link]" |

**Channels:** SMS + in-app
**Purpose:** Prompt post-visit review.

---

## Notification Content Rules

### Privacy
- **Client phone numbers** are stored in the DB but are **never included in notification bodies** visible to other roles.
- Professional and owner notifications use client name only (not phone).

### Personalisation
Every notification body must include at minimum:
- Date + time of the appointment
- Name of the entity relevant to the recipient (professional name for client, client name for professional, salon name for owner)

### Day-Before Reminder — Message Format

```
# CLIENT
"Reminder: Your appointment is tomorrow, [Day] [Date] at [HH:MM].
Professional: [First Name]
Salon: [Salon Name]
See you soon! 💅"

# PROFESSIONAL
"Tomorrow's appointments at [Salon Name]:
• [HH:MM] — [Client Name] ([Service Name], [duration] min)"

# BUSINESS OWNER
"Tomorrow at [Salon Name]: [N] confirmed appointment(s).
First appointment: [HH:MM]"
```

---

## Implementation Checklist

- [x] Client booking confirmation SMS (Twilio via Celery)
- [x] Client day-before reminder SMS (Celery beat, daily)
- [x] Professional new-review in-app notification
- [ ] Professional booking confirmation in-app
- [ ] Professional day-before reminder SMS/in-app
- [ ] Business owner booking confirmation in-app
- [ ] Business owner day-before summary in-app
- [ ] Client post-completion review prompt SMS
- [ ] Business owner new-review in-app
