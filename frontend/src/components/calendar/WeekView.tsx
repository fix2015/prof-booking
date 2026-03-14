import { addDays, formatDate, isSameDay, toISODateString, isToday } from "@/utils/dates";
import { WorkSlot, Session } from "@/types";
import { TimeSlot } from "./TimeSlot";
import { cn } from "@/utils/cn";

const HOURS = Array.from({ length: 14 }, (_, i) => i + 8); // 8am - 9pm

interface WeekViewProps {
  weekStart: Date;
  workSlots: WorkSlot[];
  sessions: Session[];
  onAddSlot?: (date: Date, start: string, end: string) => void;
  onRemoveSlot?: (slotId: number) => void;
  onSessionClick?: (session: Session) => void;
  onDayClick?: (date: Date) => void;
}

export function WeekView({
  weekStart,
  workSlots,
  sessions,
  onRemoveSlot,
  onSessionClick,
  onDayClick,
}: WeekViewProps) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="overflow-auto rounded-lg border bg-white">
      {/* Header */}
      <div className="grid grid-cols-8 border-b sticky top-0 bg-white z-10">
        <div className="border-r p-2 text-xs text-muted-foreground" />
        {days.map((day) => (
          <button
            key={day.toISOString()}
            className={cn(
              "border-r p-2 text-center text-sm font-medium hover:bg-gray-50 transition-colors",
              isToday(day) && "bg-pink-50 text-pink-700"
            )}
            onClick={() => onDayClick?.(day)}
          >
            <div className="text-xs text-muted-foreground">{formatDate(day, "EEE")}</div>
            <div
              className={cn(
                "mx-auto mt-1 flex h-7 w-7 items-center justify-center rounded-full text-sm",
                isToday(day) && "bg-pink-600 text-white font-bold"
              )}
            >
              {formatDate(day, "d")}
            </div>
          </button>
        ))}
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
              {HOURS.map((h) => (
                <div key={h} className="h-16 border-b" />
              ))}

              {/* Work slots (availability blocks) */}
              {daySlots.map((slot) => (
                <TimeSlot key={slot.id} slot={slot} onRemove={onRemoveSlot} />
              ))}

              {/* Booked sessions */}
              {daySessions.map((session) => (
                <SessionBlock key={session.id} session={session} onClick={() => onSessionClick?.(session)} />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SessionBlock({ session, onClick }: { session: Session; onClick: () => void }) {
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
        statusColors[session.status] || "bg-pink-200 border-pink-400 text-pink-900"
      )}
      style={{ top: `${top}px`, height: `${Math.max(height, 24)}px` }}
    >
      <div className="font-medium truncate">{session.client_name}</div>
      <div className="opacity-75 truncate">{session.client_phone}</div>
    </button>
  );
}
