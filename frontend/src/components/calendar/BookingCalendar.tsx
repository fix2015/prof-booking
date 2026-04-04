import { useState } from "react";
import { CalendarToolbar, CalendarView } from "./CalendarToolbar";
import { WeekView } from "./WeekView";
import { DayView } from "./DayView";
import {
  getWeekStart, addDays, toISODateString,
  formatDate, isSameDay,
} from "@/utils/dates";
import { WorkSlot, Session } from "@/types";

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
  const dayCount = view === "5day" ? 5 : 7;

  const navigate = (date: Date) => {
    setCurrentDate(date);
    onDateChange?.(date);
  };

  const goToday = () => navigate(new Date());
  const step = view === "day" ? 1 : view === "5day" ? 5 : 7;
  const goPrev = () => navigate(addDays(currentDate, -step));
  const goNext = () => navigate(addDays(currentDate, step));

  const dateLabel =
    view === "day"
      ? formatDate(currentDate, "EEEE, MMMM d, yyyy")
      : `${formatDate(weekStart, "MMM d")} – ${formatDate(addDays(weekStart, dayCount - 1), "MMM d, yyyy")}`;

  return (
    <div className="flex flex-col gap-3">
      <CalendarToolbar
        view={view}
        dateLabel={dateLabel}
        onPrev={goPrev}
        onNext={goNext}
        onToday={goToday}
        onViewChange={setView}
      />

      {view === "week" || view === "5day" ? (
        <WeekView
          weekStart={weekStart}
          dayCount={dayCount}
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
