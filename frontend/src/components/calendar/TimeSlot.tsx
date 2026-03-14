import { X } from "lucide-react";
import { WorkSlot } from "@/types";
import { timeStringToMinutes } from "@/utils/dates";

interface TimeSlotProps {
  slot: WorkSlot;
  onRemove?: (slotId: number) => void;
}

export function TimeSlot({ slot, onRemove }: TimeSlotProps) {
  const startMins = timeStringToMinutes(slot.start_time) - 8 * 60;
  const endMins = timeStringToMinutes(slot.end_time) - 8 * 60;
  const height = ((endMins - startMins) / 60) * 64;
  const top = (startMins / 60) * 64;

  return (
    <div
      className="absolute left-1 right-1 rounded bg-pink-100 border border-pink-300 px-1 overflow-hidden group"
      style={{ top: `${top}px`, height: `${height}px` }}
    >
      <div className="flex items-start justify-between">
        <span className="text-xs text-pink-700 font-medium truncate">
          {slot.start_time.slice(0, 5)} – {slot.end_time.slice(0, 5)}
        </span>
        {onRemove && (
          <button
            onClick={() => onRemove(slot.id)}
            className="hidden group-hover:flex h-4 w-4 items-center justify-center rounded text-pink-600 hover:bg-pink-200"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>
    </div>
  );
}
