import { useState } from "react";
import { createPortal } from "react-dom";
import { WorkSlot, Session } from "@/types";
import { TimeSlot } from "./TimeSlot";
import { formatDate, isToday, isBefore } from "@/utils/dates";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";

// 30-min rows from 08:00 to 22:00 → 28 rows
const ROWS: { hour: number; half: number }[] = [];
for (let h = 8; h < 22; h++) {
  ROWS.push({ hour: h, half: 0 });
  ROWS.push({ hour: h, half: 30 });
}
const ROW_HEIGHT = 32; // px per 30-min row

function padTime(h: number, m: number) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function addMinutes(timeStr: string, minutes: number): string {
  const [h, m] = timeStr.split(":").map(Number);
  const total = h * 60 + m + minutes;
  return padTime(Math.floor(total / 60) % 24, total % 60);
}

interface DayViewProps {
  date: Date;
  workSlots: WorkSlot[];
  sessions: Session[];
  onAddSlot?: (date: Date, start: string, end: string) => void;
  onRemoveSlot?: (slotId: number) => void;
  onSessionClick?: (session: Session) => void;
}

export function DayView({ date, workSlots, sessions, onAddSlot, onRemoveSlot, onSessionClick }: DayViewProps) {
  const [form, setForm] = useState<{ start: string; end: string } | null>(null);
  const now = new Date();

  const isPastDate = isBefore(date, new Date(now.getFullYear(), now.getMonth(), now.getDate()));

  const isPastRow = (hour: number, half: number) => {
    if (isPastDate) return true;
    if (isToday(date) && (hour < now.getHours() || (hour === now.getHours() && half <= now.getMinutes()))) return true;
    return false;
  };

  const handleRowClick = (hour: number, half: number) => {
    if (!onAddSlot || isPastRow(hour, half)) return;
    const start = padTime(hour, half);
    const end = addMinutes(start, 60);
    setForm({ start, end });
  };

  const handleSubmit = () => {
    if (!form || !onAddSlot) return;
    if (form.end <= form.start) return;
    onAddSlot(date, form.start, form.end);
    setForm(null);
  };

  return (
    <>
      <div className="rounded-lg border bg-white overflow-auto">
        <div className="border-b p-4">
          <h3 className="font-semibold">{formatDate(date, "EEEE, MMMM d, yyyy")}</h3>
          <p className="text-sm text-muted-foreground">
            {workSlots.length} availability block{workSlots.length !== 1 ? "s" : ""} · {sessions.length} session{sessions.length !== 1 ? "s" : ""}
            {onAddSlot && <span className="ml-2 text-gray-500">· click a row to add a slot</span>}
          </p>
        </div>

        <div className="flex">
          {/* Time labels (each row = 30 min) */}
          <div className="w-16 border-r flex-shrink-0">
            {ROWS.map(({ hour, half }) => (
              <div
                key={`${hour}-${half}`}
                className="border-b px-2 pt-0.5 text-[10px] text-muted-foreground"
                style={{ height: ROW_HEIGHT }}
              >
                {half === 0 ? (hour === 12 ? "12 PM" : hour > 12 ? `${hour - 12} PM` : `${hour} AM`) : ""}
              </div>
            ))}
          </div>

          {/* Main column */}
          <div className="relative flex-1">
            {ROWS.map(({ hour, half }) => {
              const past = isPastRow(hour, half);
              return (
                <div
                  key={`${hour}-${half}`}
                  className={cn(
                    "border-b transition-colors",
                    half === 0 ? "border-gray-200" : "border-gray-100 border-dashed",
                    past
                      ? "bg-gray-50/70 cursor-not-allowed"
                      : onAddSlot && "cursor-pointer hover:bg-gray-50/60"
                  )}
                  style={{ height: ROW_HEIGHT }}
                  onClick={() => handleRowClick(hour, half)}
                />
              );
            })}

            {/* Work slot blocks */}
            {workSlots.map((slot) => (
              <TimeSlot key={slot.id} slot={slot} onRemove={onRemoveSlot} />
            ))}

            {/* Session blocks */}
            {sessions.map((session) => {
              const start = new Date(session.starts_at);
              const end = new Date(session.ends_at);
              const startMins = start.getHours() * 60 + start.getMinutes() - 8 * 60;
              const durationMins = (end.getTime() - start.getTime()) / 60000;
              return (
                <button
                  key={session.id}
                  onClick={() => onSessionClick?.(session)}
                  className="absolute left-1 right-1 rounded border bg-blue-100 border-blue-300 px-2 py-0.5 text-xs text-blue-900 text-left hover:bg-blue-200 transition-colors overflow-hidden"
                  style={{
                    top: `${(startMins / 30) * ROW_HEIGHT}px`,
                    height: `${Math.max((durationMins / 30) * ROW_HEIGHT, ROW_HEIGHT)}px`,
                  }}
                >
                  <div className="font-semibold leading-tight">{session.client_name}</div>
                  <div className="opacity-75 text-[10px]">{session.client_phone}</div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Add slot modal — rendered in document.body to escape overflow clipping */}
      {form && createPortal(
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50"
          onClick={() => setForm(null)}
        >
          <div
            className="bg-white rounded-xl shadow-xl p-6 w-full max-w-sm mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-semibold text-base mb-1">Add Work Slot</h3>
            <p className="text-xs text-muted-foreground mb-4">{formatDate(date, "EEEE, MMMM d, yyyy")}</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium w-12">Start</label>
                <input
                  type="time"
                  value={form.start}
                  onChange={(e) => setForm((f) => f && { ...f, start: e.target.value })}
                  className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-400"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium w-12">End</label>
                <input
                  type="time"
                  value={form.end}
                  onChange={(e) => setForm((f) => f && { ...f, end: e.target.value })}
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
        </div>,
        document.body
      )}
    </>
  );
}
