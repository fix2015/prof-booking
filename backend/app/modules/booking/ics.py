"""iCalendar (RFC 5545) export of a booking, for "Add to Calendar" on the confirmation screen."""
from datetime import datetime
from typing import Optional


def _escape(value: str) -> str:
    return (
        value.replace("\\", "\\\\").replace(";", "\;").replace(",", "\\,")
        .replace("\r\n", "\\n").replace("\n", "\\n")
    )


def _fold(line: str) -> str:
    """Fold content lines longer than 75 octets (RFC 5545 §3.1)."""
    raw = line.encode("utf-8")
    if len(raw) <= 75:
        return line
    parts, current = [], b""
    for ch in line:
        b = ch.encode("utf-8")
        if len(current) + len(b) > (75 if not parts else 74):
            parts.append(current.decode("utf-8"))
            current = b""
        current += b
    parts.append(current.decode("utf-8"))
    return "\r\n ".join(parts)


def _floating(dt: datetime) -> str:
    # Booking times are stored as the salon's local wall-clock time, so they are emitted as "floating" times
    # (no Z / TZID) and shown at the same wall-clock time on the client's device.
    return dt.strftime("%Y%m%dT%H%M%S")


def build_booking_ics(
    *,
    uid: str,
    title: str,
    starts_at: datetime,
    ends_at: datetime,
    location: Optional[str] = None,
    description: Optional[str] = None,
    now: Optional[datetime] = None,
) -> str:
    stamp = (now or datetime.utcnow()).strftime("%Y%m%dT%H%M%SZ")
    lines = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//ProBook//Booking//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH",
        "BEGIN:VEVENT",
        f"UID:{uid}",
        f"DTSTAMP:{stamp}",
        f"DTSTART:{_floating(starts_at)}",
        f"DTEND:{_floating(ends_at)}",
        f"SUMMARY:{_escape(title)}",
    ]
    if location:
        lines.append(f"LOCATION:{_escape(location)}")
    if description:
        lines.append(f"DESCRIPTION:{_escape(description)}")
    for trigger, label in (("-P1D", "tomorrow"), ("-PT2H", "in 2 hours")):
        lines += [
            "BEGIN:VALARM",
            "ACTION:DISPLAY",
            f"DESCRIPTION:{_escape(f'{title} {label}')}",
            f"TRIGGER:{trigger}",
            "END:VALARM",
        ]
    lines += ["END:VEVENT", "END:VCALENDAR"]
    return "\r\n".join(_fold(line) for line in lines) + "\r\n"
