/** Helpers for "next available" slot chips and booking-form pre-fill. Pure functions — see slots.test.ts. */

export function localDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function localTimeString(d: Date): string {
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** "today" | "tomorrow" | null (any other day) for a YYYY-MM-DD slot date relative to `now`. */
export function relativeDay(slotDate: string, now: Date = new Date()): "today" | "tomorrow" | null {
  if (slotDate === localDateString(now)) return "today";
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  if (slotDate === localDateString(tomorrow)) return "tomorrow";
  return null;
}

export interface SlotPrefill {
  date: string;
  time: string; // HH:MM
  professionalId?: number;
}

/** Booking URL that pre-fills date/time/professional. */
export function bookingPrefillUrl(providerId: number, slot: SlotPrefill): string {
  const params = new URLSearchParams({ date: slot.date, time: slot.time });
  if (slot.professionalId) params.set("professional_id", String(slot.professionalId));
  return `/book/${providerId}?${params.toString()}`;
}

/** Parse the pre-fill query params back; returns null when missing or malformed. */
export function parseSlotPrefill(params: URLSearchParams): SlotPrefill | null {
  const date = params.get("date");
  const time = params.get("time");
  if (!date || !time || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) return null;
  const pro = Number(params.get("professional_id"));
  return { date, time, professionalId: Number.isInteger(pro) && pro > 0 ? pro : undefined };
}
