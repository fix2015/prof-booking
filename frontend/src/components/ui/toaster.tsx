import { useToast } from "@/hooks/useToast";
import { cn } from "@/utils/cn";
import { X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-ds-4 left-ds-4 right-ds-4 sm:left-auto sm:right-ds-4 z-[100] flex flex-col gap-ds-2 w-auto sm:w-full sm:max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start gap-ds-3 rounded-ds-md border px-ds-4 py-ds-3 shadow-lg ds-body transition-all",
            t.variant === "destructive" && "bg-ds-feedback-error border-ds-feedback-error text-ds-text-inverse",
            t.variant === "success" && "bg-ds-feedback-success border-ds-feedback-success text-ds-text-inverse",
            (!t.variant || t.variant === "default") && "bg-ds-bg-primary border-ds-border text-ds-text-primary"
          )}
        >
          <div className="flex-1">
            {t.title && <p className="ds-body-strong">{t.title}</p>}
            {t.description && <p className="ds-caption opacity-90 mt-ds-1">{t.description}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} className="shrink-0 opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
