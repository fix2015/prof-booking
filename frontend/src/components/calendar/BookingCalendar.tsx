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

type CalendarView = "week" | "day";

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
  const goPrev = () =>
    navigate(view === "week" ? subWeeks(currentDate, 1) : addDays(currentDate, -1));
  const goNext = () =>
    navigate(view === "week" ? addWeeks(currentDate, 1) : addDays(currentDate, 1));

  const dateLabel =
    view === "week"
      ? `${formatDate(weekStart, "MMM d")} – ${formatDate(addDays(weekStart, 6), "MMM d, yyyy")}`
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
        <div className="flex gap-1 rounded-md border p-1">
          {(["week", "day"] as CalendarView[]).map((v) => (
            <Button
              key={v}
              variant={view === v ? "default" : "ghost"}
              size="sm"
              className="capitalize"
              onClick={() => setView(v)}
            >
              {v}
            </Button>
          ))}
        </div>
      </div>

      {/* Calendar Body */}
      {view === "week" ? (
        <WeekView
          weekStart={weekStart}
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
