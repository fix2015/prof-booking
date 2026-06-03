import { X } from "lucide-react";
import { WorkSlot } from "@/types";
import { timeStringToMinutes } from "@/utils/dates";

interface TimeSlotProps {
  slot: WorkSlot;
  onRemove?: (slotId: number) => void;
  onClick?: (slot: WorkSlot) => void;
}

export function TimeSlot({ slot, onRemove, onClick }: TimeSlotProps) {
  const startMins = timeStringToMinutes(slot.start_time) - 8 * 60;
  const endMins = timeStringToMinutes(slot.end_time) - 8 * 60;
  const height = ((endMins - startMins) / 60) * 64;
  const top = (startMins / 60) * 64;

  return (
    <button
      type="button"
      onClick={() => onClick?.(slot)}
      className="absolute left-1 right-1 rounded bg-gray-100 border border-gray-300 px-1 overflow-hidden group text-left cursor-pointer hover:bg-gray-200/70 transition-colors"
      style={{ top: `${top}px`, height: `${height}px` }}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs text-gray-700 font-medium truncate">
          {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
        </span>
        {onRemove && (
          <span
            role="button"
            onClick={(e) => { e.stopPropagation(); onRemove(slot.id); }}
            className="hidden group-hover:flex h-4 w-4 items-center justify-center rounded text-gray-700 hover:bg-gray-300"
          >
            <X className="h-3 w-3" />
          </span>
        )}
      </div>
    </button>
  );
}
