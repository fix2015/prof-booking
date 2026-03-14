import { useState } from "react";
import { WorkSlot, Session } from "@/types";
import { TimeSlot } from "./TimeSlot";
import { formatDate } from "@/utils/dates";
import { cn } from "@/utils/cn";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8);

interface DayViewProps {
  date: Date;
  workSlots: WorkSlot[];
  sessions: Session[];
  onAddSlot?: (date: Date, start: string, end: string) => void;
  onRemoveSlot?: (slotId: number) => void;
  onSessionClick?: (session: Session) => void;
}

export function DayView({ date, workSlots, sessions, onAddSlot, onRemoveSlot, onSessionClick }: DayViewProps) {
  const [selectedHour, setSelectedHour] = useState<number | null>(null);

  const handleHourClick = (hour: number) => {
    if (!onAddSlot) return;
    setSelectedHour(hour);
    const start = `${String(hour).padStart(2, "0")}:00`;
    const end = `${String(hour + 1).padStart(2, "0")}:00`;
    onAddSlot(date, start, end);
    setSelectedHour(null);
  };

  return (
    <div className="rounded-lg border bg-white overflow-auto">
      <div className="border-b p-4">
        <h3 className="font-semibold">{formatDate(date, "EEEE, MMMM d, yyyy")}</h3>
        <p className="text-sm text-muted-foreground">
          {workSlots.length} availability blocks · {sessions.length} sessions
        </p>
      </div>

      <div className="flex">
        {/* Time labels */}
        <div className="w-20 border-r flex-shrink-0">
          {HOURS.map((h) => (
            <div key={h} className="h-16 border-b px-2 pt-1 text-xs text-muted-foreground">
              {h === 12 ? "12 PM" : h > 12 ? `${h - 12} PM` : `${h} AM`}
            </div>
          ))}
        </div>

        {/* Main column */}
        <div className="relative flex-1">
          {HOURS.map((h) => (
            <div
              key={h}
              className={cn(
                "h-16 border-b cursor-pointer hover:bg-gray-50 transition-colors",
                selectedHour === h && "bg-pink-50"
              )}
              onClick={() => handleHourClick(h)}
            />
          ))}

          {workSlots.map((slot) => (
            <TimeSlot key={slot.id} slot={slot} onRemove={onRemoveSlot} />
          ))}

          {sessions.map((session) => {
            const start = new Date(session.starts_at);
            const end = new Date(session.ends_at);
            const startMins = start.getHours() * 60 + start.getMinutes() - 8 * 60;
            const durationMins = (end.getTime() - start.getTime()) / 60000;
            return (
              <button
                key={session.id}
                onClick={() => onSessionClick?.(session)}
                className="absolute left-2 right-2 rounded border bg-blue-100 border-blue-300 px-2 py-1 text-xs text-blue-900 text-left hover:bg-blue-200 transition-colors overflow-hidden"
                style={{
                  top: `${(startMins / 60) * 64}px`,
                  height: `${Math.max((durationMins / 60) * 64, 32)}px`,
                }}
              >
                <div className="font-semibold">{session.client_name}</div>
                <div className="opacity-75">{session.client_phone}</div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
