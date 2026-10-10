/** Today-view timeline helpers. Pure — see agenda.test.ts. */
import { parseBookingTime } from "./reminders";

export type Attendance = "attended" | "no_show" | "late_cancel";

export interface AgendaLike {
  starts_at: string;
  ends_at: string;
  status: string;
  late_cancelled?: boolean;
}

/** Current attendance flag of a booking. */
export function attendanceOf(item: AgendaLike): Attendance {
  if (item.status === "no_show") return "no_show";
  if (item.status === "cancelled" && item.late_cancelled) return "late_cancel";
  return "attended";
}

/** Pressing an active toggle clears it (back to attended); pressing another one switches to it. */
export function nextAttendance(current: Attendance, pressed: Exclude<Attendance, "attended">): Attendance {
  return current === pressed ? "attended" : pressed;
}

/** Where an appointment sits relative to `now`: done, happening now, or still to come. */
export function timelinePhase(item: AgendaLike, now: Date): "past" | "now" | "upcoming" {
  const start = parseBookingTime(item.starts_at).getTime();
  const end = parseBookingTime(item.ends_at).getTime();
  if (now.getTime() >= end) return "past";
  if (now.getTime() >= start) return "now";
  return "upcoming";
}

/** Index of the appointment to highlight: the one in progress, else the next one still to come. */
export function focusIndex(items: AgendaLike[], now: Date): number {
  const active = items.filter((i) => i.status !== "cancelled" && i.status !== "no_show");
  const current = active.find((i) => timelinePhase(i, now) === "now") ?? active.find((i) => timelinePhase(i, now) === "upcoming");
  return current ? items.indexOf(current) : -1;
}

/** tel: link that keeps only dialable characters. */
export function telHref(phone: string): string {
  return `tel:${phone.replace(/[^\d+]/g, "")}`;
}
