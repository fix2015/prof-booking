import { cn } from "@/utils/cn";

interface SpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizeMap = { sm: "h-4 w-4", md: "h-8 w-8", lg: "h-12 w-12" };

export function Spinner({ className, size = "md" }: SpinnerProps) {
  return (
    <div
      className={cn(
        "animate-spin rounded-ds-full border-2 border-ds-border border-t-ds-interactive",
        sizeMap[size],
        className
      )}
    />
  );
}

export function FullPageSpinner() {
  return (
    <div className="flex h-screen items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}
