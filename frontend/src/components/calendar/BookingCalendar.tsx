import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WeekView } from "./WeekView";
import { DayView } from "./DayView";
import {
  getWeekStart, addDays, toISODateString,
  formatDate, isSameDay,
} from "@/utils/dates";
import { WorkSlot, Session } from "@/types";
import { cn } from "@/utils/cn";

type CalendarView = "week" | "5day" | "day";

interface BookingCalendarProps {
  workSlots: WorkSlot[];
  sessions: Session[];
  onAddSlot?: (date: Date, start: string, end: string) => void;
  onRemoveSlot?: (slotId: number) => void;
  onSessionClick?: (session: Session) => void;
  onDateChange?: (date: Date) => void;
}

const VIEW_OPTIONS: { key: CalendarView; label: string }[] = [
  { key: "week", label: "Week" },
  { key: "5day", label: "5 Day" },
  { key: "day", label: "Day" },
];

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
  const goPrev = () => {
    if (view === "day") navigate(addDays(currentDate, -1));
    else navigate(addDays(currentDate, -7));
  };
  const goNext = () => {
    if (view === "day") navigate(addDays(currentDate, 1));
    else navigate(addDays(currentDate, 7));
  };

  const dateLabel =
    view === "day"
      ? formatDate(currentDate, "EEEE, MMMM d, yyyy")
      : `${formatDate(weekStart, "MMM d")} – ${formatDate(addDays(weekStart, dayCount - 1), "MMM d, yyyy")}`;

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar — row 1: nav + date, row 2: view toggle (on small screens) */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Arrow buttons */}
        <button
          onClick={goPrev}
          className="inline-flex h-[32px] w-[32px] items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-gray-700" />
        </button>
        <button
          onClick={goNext}
          className="inline-flex h-[32px] w-[32px] items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-gray-700" />
        </button>

        {/* Today button */}
        <button
          onClick={goToday}
          className="h-[32px] px-3 rounded-lg border border-gray-200 bg-white text-sm font-medium text-gray-900 hover:bg-gray-50 transition-colors"
        >
          Today
        </button>

        {/* Date label */}
        <span className="text-xs font-medium text-gray-900 whitespace-nowrap">{dateLabel}</span>

        {/* Spacer pushes toggle right */}
        <span className="flex-1 min-w-[8px]" />

        {/* View toggle */}
        <div className="flex rounded-lg bg-gray-100 p-1 gap-0.5">
          {VIEW_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={cn(
                "px-2.5 py-1 text-xs rounded-md transition-colors whitespace-nowrap",
                view === key
                  ? "bg-gray-900 text-white font-medium shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Calendar Body */}
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
