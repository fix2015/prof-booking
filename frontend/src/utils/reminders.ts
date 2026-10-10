/** Booking reminder timing (24 h and 2 h before). Pure — see reminders.test.ts. */

export type ReminderKind = "day" | "hours";

export interface PlannedReminder {
  id: number;
  kind: ReminderKind;
  at: Date;
}

const OFFSETS: { kind: ReminderKind; ms: number; slot: number }[] = [
  { kind: "day", ms: 24 * 60 * 60 * 1000, slot: 1 },
  { kind: "hours", ms: 2 * 60 * 60 * 1000, slot: 2 },
];

/** Parse a backend booking time ("2030-01-07T11:00:00", salon wall-clock time) as a local Date. */
export function parseBookingTime(startsAt: string): Date {
  const m = startsAt.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (!m) return new Date(startsAt);
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
}

/** Stable 32-bit notification ids per booking, so reminders can be replaced or cancelled. */
export function reminderId(sessionId: number, slot: number): number {
  return (sessionId % 200_000_000) * 10 + slot;
}

/** Reminders still in the future (at least a minute ahead of `now`). */
export function planReminders(sessionId: number, startsAt: string, now: Date = new Date()): PlannedReminder[] {
  const start = parseBookingTime(startsAt).getTime();
  return OFFSETS
    .map((o) => ({ id: reminderId(sessionId, o.slot), kind: o.kind, at: new Date(start - o.ms) }))
    .filter((r) => r.at.getTime() > now.getTime() + 60_000);
}

export function allReminderIds(sessionId: number): number[] {
  return OFFSETS.map((o) => reminderId(sessionId, o.slot));
}
