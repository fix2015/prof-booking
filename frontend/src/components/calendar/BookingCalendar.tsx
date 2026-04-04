import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
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
      {/* Toolbar — wraps to 2 lines on small screens */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={goPrev}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 w-8 p-0" onClick={goNext}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 px-3" onClick={goToday}>
            Today
          </Button>
        </div>
        <span className="text-xs font-medium whitespace-nowrap">{dateLabel}</span>
        <span className="flex-1" />
        <div className="flex gap-0.5 rounded-md bg-muted p-0.5">
          {VIEW_OPTIONS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={cn(
                "px-2.5 py-1 text-xs rounded-md transition-colors",
                view === key
                  ? "bg-gray-900 text-white font-medium"
                  : "text-muted-foreground hover:text-foreground"
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
