import {
  format, parseISO, startOfWeek, addDays,
  addWeeks, subWeeks, isSameDay, isToday, isBefore, isAfter,
} from "date-fns";

export const formatDate = (date: string | Date, fmt = "MMM d, yyyy") =>
  format(typeof date === "string" ? parseISO(date) : date, fmt);

export const formatTime = (date: string | Date) =>
  format(typeof date === "string" ? parseISO(date) : date, "h:mm a");

export const formatDateTime = (date: string | Date) =>
  format(typeof date === "string" ? parseISO(date) : date, "MMM d, yyyy 'at' h:mm a");

export const formatTimeRange = (start: string | Date, end: string | Date) =>
  `${formatTime(start)} – ${formatTime(end)}`;

export const toISODateString = (date: Date) => format(date, "yyyy-MM-dd");
export const toISODateTimeString = (date: Date) => date.toISOString();

export const getWeekDays = (weekStart: Date) =>
  Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

export const getWeekStart = (date: Date) =>
  startOfWeek(date, { weekStartsOn: 1 }); // Monday

export { addWeeks, subWeeks, isSameDay, isToday, isBefore, isAfter, parseISO, format, addDays };

export function minutesToTimeString(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function timeStringToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}
