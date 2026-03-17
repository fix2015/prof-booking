import { Check } from "lucide-react";
import { cn } from "@/utils/cn";
import { t } from "@/i18n";

export interface Step {
  label: string;
  description?: string;
}

interface StepIndicatorProps {
  steps: Step[];
  currentStep: number; // 0-indexed
  className?: string;
}

/**
 * Horizontal step indicator for multi-step flows.
 *
 * @example
 * <StepIndicator
 *   steps={[{ label: "Profile" }, { label: "Services" }, { label: "Schedule" }]}
 *   currentStep={1}
 * />
 */
export function StepIndicator({ steps, currentStep, className }: StepIndicatorProps) {
  return (
    <div className={cn("w-full", className)} role="list" aria-label={t("onboarding.step", { current: currentStep + 1, total: steps.length })}>
      <div className="flex items-center gap-0">
        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isActive = index === currentStep;
          const isLast = index === steps.length - 1;

          return (
            <div key={index} className="flex items-center flex-1 min-w-0" role="listitem">
              {/* Circle */}
              <div className="flex flex-col items-center shrink-0">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold transition-colors",
                    isCompleted && "bg-gray-900 text-white",
                    isActive && "bg-gray-900 text-white ring-4 ring-gray-900/20",
                    !isCompleted && !isActive && "border-2 border-gray-300 text-gray-400 bg-white",
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "mt-1.5 text-xs text-center leading-tight max-w-[64px] truncate",
                    isActive ? "font-semibold text-gray-900" : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
                {step.description && isActive && (
                  <span className="mt-0.5 text-[10px] text-muted-foreground text-center max-w-[80px] leading-tight">
                    {step.description}
                  </span>
                )}
              </div>

              {/* Connector line (not after last) */}
              {!isLast && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 mt-[-16px]",
                    index < currentStep ? "bg-gray-900" : "bg-gray-200",
                  )}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
