import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/utils/cn";

export type CalendarView = "week" | "5day" | "day";

interface CalendarToolbarProps {
  view: CalendarView;
  dateLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  onViewChange: (view: CalendarView) => void;
}

const VIEW_OPTIONS: { key: CalendarView; label: string }[] = [
  { key: "week", label: "Week" },
  { key: "5day", label: "5 Day" },
  { key: "day", label: "Day" },
];

export function CalendarToolbar({
  view,
  dateLabel,
  onPrev,
  onNext,
  onToday,
  onViewChange,
}: CalendarToolbarProps) {
  return (
    <div className="flex flex-col gap-2">
      {/* Row 1: Date label + arrow buttons */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-semibold text-gray-900 flex-1 min-w-0 truncate">
          {dateLabel}
        </span>
        <button
          onClick={onPrev}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft className="h-4 w-4 text-gray-500" />
        </button>
        <button
          onClick={onNext}
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
        >
          <ChevronRight className="h-4 w-4 text-gray-500" />
        </button>
      </div>

      {/* Row 2: Today pill + view tabs */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToday}
          className="h-8 px-4 rounded-full bg-gray-900 text-white text-xs font-medium hover:bg-gray-800 transition-colors"
        >
          Today
        </button>
        <span className="flex-1" />
        {VIEW_OPTIONS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => onViewChange(key)}
            className={cn(
              "relative px-2 pb-1.5 text-xs transition-colors",
              view === key
                ? "text-gray-900 font-semibold"
                : "text-gray-400 hover:text-gray-600"
            )}
          >
            {label}
            {view === key && (
              <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 w-5 rounded-full bg-gray-900" />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
