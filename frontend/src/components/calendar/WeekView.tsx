import { useState } from "react";
import { addDays, formatDate, isSameDay, toISODateString, isToday, isBefore } from "@/utils/dates";
import { WorkSlot, Session } from "@/types";
import { TimeSlot } from "./TimeSlot";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8am - 9pm

function padTime(h: number, m: number) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

interface WeekViewProps {
  weekStart: Date;
  workSlots: WorkSlot[];
  sessions: Session[];
  onAddSlot?: (date: Date, start: string, end: string) => void;
  onRemoveSlot?: (slotId: number) => void;
  onSessionClick?: (session: Session) => void;
  onDayClick?: (date: Date) => void;
}

interface SlotForm {
  date: Date;
  start: string;
  end: string;
}

export function WeekView({
  weekStart,
  workSlots,
  sessions,
  onAddSlot,
  onRemoveSlot,
  onSessionClick,
  onDayClick,
}: WeekViewProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const [form, setForm] = useState<SlotForm | null>(null);

  const now = new Date();

  const isPastCell = (day: Date, hour: number) => {
    if (isBefore(day, new Date(now.getFullYear(), now.getMonth(), now.getDate()))) return true;
    if (isToday(day) && hour < now.getHours()) return true;
    return false;
  };

  const handleCellClick = (day: Date, hour: number) => {
    if (!onAddSlot || isPastCell(day, hour)) return;
    setForm({ date: day, start: padTime(hour, 0), end: padTime(hour + 1, 0) });
  };

  const handleSubmit = () => {
    if (!form || !onAddSlot) return;
    if (form.end <= form.start) return;
    onAddSlot(form.date, form.start, form.end);
    setForm(null);
  };

  return (
    <div>
      {/* Add slot modal */}
      {form !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setForm(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-base mb-1">Add Work Slot</h3>
            <p className="text-xs text-muted-foreground mb-4">
              {formatDate(form.date, "EEEE, MMMM d, yyyy")}
            </p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium w-12">Start</label>
                <input
                  type="time"
                  value={form.start}
                  onChange={(e) => setForm((f) => f ? { ...f, start: e.target.value } : f)}
                  className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium w-12">End</label>
                <input
                  type="time"
                  value={form.end}
                  onChange={(e) => setForm((f) => f ? { ...f, end: e.target.value } : f)}
                  className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
              {form.end <= form.start && (
                <p className="text-xs text-destructive">End must be after start</p>
              )}
            </div>
            <div className="flex gap-2 mt-5">
              <Button className="flex-1" onClick={handleSubmit} disabled={form.end <= form.start}>
                Add Slot
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setForm(null)}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Calendar grid */}
      <div className="overflow-auto rounded-lg border bg-white">
        {/* Header */}
        <div className="grid grid-cols-8 border-b sticky top-0 bg-white z-10">
          <div className="border-r p-2 text-xs text-muted-foreground" />
          {days.map((day) => {
            const isPastDay = isBefore(day, new Date(now.getFullYear(), now.getMonth(), now.getDate()));
            return (
              <button
                key={day.toISOString()}
                className={cn(
                  "border-r p-2 text-center text-sm font-medium hover:bg-gray-50 transition-colors",
                  isToday(day) && "bg-gray-50 text-gray-700",
                  isPastDay && "opacity-50"
                )}
                onClick={() => onDayClick?.(day)}
              >
                <div className="text-xs text-muted-foreground">{formatDate(day, "EEE")}</div>
                <div
                  className={cn(
                    "mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full text-sm",
                    isToday(day) && "bg-gray-900 text-white font-bold"
                  )}
                >
                  {formatDate(day, "d")}
                </div>
              </button>
            );
          })}
        </div>

        {/* Time grid */}
        <div className="grid grid-cols-8">
          {/* Time labels */}
          <div className="border-r">
            {HOURS.map((h) => (
              <div key={h} className="h-16 border-b px-2 pt-1 text-xs text-muted-foreground">
                {h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`}
              </div>
            ))}
          </div>

          {/* Day columns */}
          {days.map((day) => {
            const dateStr = toISODateString(day);
            const daySlots = workSlots.filter((s) => s.slot_date === dateStr);
            const daySessions = sessions.filter((s) => isSameDay(new Date(s.starts_at), day));

            return (
              <div key={dateStr} className="relative border-r">
                {HOURS.map((h) => {
                  const past = isPastCell(day, h);
                  return (
                    <div
                      key={h}
                      className={cn(
                        "h-16 border-b transition-colors",
                        past
                          ? "bg-gray-50/70 cursor-not-allowed"
                          : onAddSlot && "cursor-pointer hover:bg-gray-50/60"
                      )}
                      onClick={() => handleCellClick(day, h)}
                    />
                  );
                })}

                {daySlots.map((slot) => (
                  <TimeSlot key={slot.id} slot={slot} onRemove={onRemoveSlot} />
                ))}

                {daySessions.map((session) => (
                  <WeekSessionBlock
                    key={session.id}
                    session={session}
                    onClick={() => onSessionClick?.(session)}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function WeekSessionBlock({ session, onClick }: { session: Session; onClick: () => void }) {
  const start = new Date(session.starts_at);
  const end = new Date(session.ends_at);
  const startMinutes = start.getHours() * 60 + start.getMinutes() - 8 * 60;
  const durationMinutes = (end.getTime() - start.getTime()) / 60000;

  const top = (startMinutes / 60) * 64;
  const height = (durationMinutes / 60) * 64;

  const statusColors: Record<string, string> = {
    pending: "bg-yellow-200 border-yellow-400 text-yellow-900",
    confirmed: "bg-blue-200 border-blue-400 text-blue-900",
    in_progress: "bg-purple-200 border-purple-400 text-purple-900",
    completed: "bg-green-200 border-green-400 text-green-900",
    cancelled: "bg-gray-200 border-gray-400 text-gray-600",
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        "absolute left-1 right-1 rounded border px-1 py-0.5 text-xs overflow-hidden hover:opacity-90 transition-opacity",
        statusColors[session.status] || "bg-gray-200 border-gray-400 text-gray-900"
      )}
      style={{ top: `${top}px`, height: `${Math.max(height, 24)}px` }}
    >
      <div className="font-medium truncate">{session.client_name}</div>
      <div className="opacity-75 truncate">{session.client_phone}</div>
    </button>
  );
}
