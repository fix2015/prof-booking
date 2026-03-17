import { cn } from "@/utils/cn";

interface ProgressBarProps {
  /** 0–100 */
  value: number;
  /** Displayed label, defaults to "{value}%" */
  label?: string;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Animated horizontal progress bar.
 *
 * @example
 * <ProgressBar value={66} label="Step 2 of 3" showLabel />
 */
export function ProgressBar({ value, label, showLabel = false, size = "md", className }: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));
  const displayLabel = label ?? `${Math.round(clamped)}%`;

  const heights: Record<typeof size, string> = {
    sm: "h-1",
    md: "h-2",
    lg: "h-3",
  };

  return (
    <div className={cn("w-full space-y-1", className)}>
      {showLabel && (
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">{displayLabel}</span>
          <span className="text-xs font-medium text-gray-900">{Math.round(clamped)}%</span>
        </div>
      )}
      <div
        className={cn("w-full rounded-full bg-gray-100 overflow-hidden", heights[size])}
        role="progressbar"
        aria-valuenow={Math.round(clamped)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={displayLabel}
      >
        <div
          className={cn("h-full rounded-full bg-gray-900 transition-all duration-500 ease-out")}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
}
