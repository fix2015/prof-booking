import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WeekView } from "./WeekView";
import { DayView } from "./DayView";
import {
  getWeekStart, addWeeks, subWeeks, addDays, toISODateString,
  formatDate, isSameDay,
} from "@/utils/dates";
import { WorkSlot, Session } from "@/types";

type CalendarView = "week" | "5day" | "day";

interface BookingCalendarProps {
  workSlots: WorkSlot[];
  sessions: Session[];
  onAddSlot?: (date: Date, start: string, end: string) => void;
  onRemoveSlot?: (slotId: number) => void;
  onSessionClick?: (session: Session) => void;
  onDateChange?: (date: Date) => void;
}

export function BookingCalendar({
  workSlots,
  sessions,
  onAddSlot,
  onRemoveSlot,
  onSessionClick,
  onDateChange,
}: BookingCalendarProps) {
  const [view, setView] = useState<CalendarView>("week");
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekStart = getWeekStart(currentDate);

  const navigate = (date: Date) => {
    setCurrentDate(date);
    onDateChange?.(date);
  };

  const goToday = () => navigate(new Date());
  const goPrev = () => {
    if (view === "week") navigate(subWeeks(currentDate, 1));
    else if (view === "5day") navigate(addDays(currentDate, -7));
    else navigate(addDays(currentDate, -1));
  };
  const goNext = () => {
    if (view === "week") navigate(addWeeks(currentDate, 1));
    else if (view === "5day") navigate(addDays(currentDate, 7));
    else navigate(addDays(currentDate, 1));
  };

  const dateLabel =
    view === "week"
      ? `${formatDate(weekStart, "MMM d")} – ${formatDate(addDays(weekStart, 6), "MMM d, yyyy")}`
      : view === "5day"
        ? `${formatDate(weekStart, "MMM d")} – ${formatDate(addDays(weekStart, 4), "MMM d, yyyy")}`
        : formatDate(currentDate, "EEEE, MMMM d, yyyy");

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>
            Today
          </Button>
          <span className="ml-2 text-sm font-medium">{dateLabel}</span>
        </div>
        <div className="flex gap-1 rounded-md bg-muted p-1">
          {([
            { key: "week", label: "Week" },
            { key: "5day", label: "5 Day" },
            { key: "day", label: "Day" },
          ] as { key: CalendarView; label: string }[]).map(({ key, label }) => (
            <Button
              key={key}
              variant={view === key ? "default" : "ghost"}
              size="sm"
              onClick={() => setView(key)}
            >
              {label}
            </Button>
          ))}
        </div>
      </div>

      {/* Calendar Body */}
      {view === "week" || view === "5day" ? (
        <WeekView
          weekStart={weekStart}
          dayCount={view === "5day" ? 5 : 7}
          workSlots={workSlots}
          sessions={sessions}
          onAddSlot={onAddSlot}
          onRemoveSlot={onRemoveSlot}
          onSessionClick={onSessionClick}
          onDayClick={(d) => { navigate(d); setView("day"); }}
        />
      ) : (
        <DayView
          date={currentDate}
          workSlots={workSlots.filter((s) => s.slot_date === toISODateString(currentDate))}
          sessions={sessions.filter((s) => isSameDay(new Date(s.starts_at), currentDate))}
          onAddSlot={onAddSlot}
          onRemoveSlot={onRemoveSlot}
          onSessionClick={onSessionClick}
        />
      )}
    </div>
  );
}
