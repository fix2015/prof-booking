import { useToast } from "@/hooks/useToast";
import { t } from "@/i18n";
import { cn } from "@/utils/cn";
import { X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-ds-4 left-ds-4 right-ds-4 sm:left-auto sm:right-ds-4 z-[100] flex flex-col gap-ds-2 w-auto sm:w-full sm:max-w-sm" role="status" aria-live="polite">
      {toasts.map((item) => (
        <div
          key={item.id}
          className={cn(
            "flex items-start gap-ds-3 rounded-ds-md border px-ds-4 py-ds-3 shadow-lg ds-body transition-all",
            item.variant === "destructive" && "bg-ds-feedback-error border-ds-feedback-error text-ds-text-inverse",
            item.variant === "success" && "bg-ds-feedback-success border-ds-feedback-success text-ds-text-inverse",
            (!item.variant || item.variant === "default") && "bg-ds-bg-primary border-ds-border text-ds-text-primary"
          )}
        >
          <div className="flex-1">
            {item.title && <p className="ds-body-strong">{item.title}</p>}
            {item.description && <p className="ds-caption opacity-90 mt-ds-1">{item.description}</p>}
          </div>
          <button aria-label={t("common.close")} onClick={() => dismiss(item.id)} className="shrink-0 opacity-70 hover:opacity-100">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>
      ))}
    </div>
  );
}
