import { useToast } from "@/hooks/useToast";
import { cn } from "@/utils/cn";
import { X } from "lucide-react";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 z-[100] flex flex-col gap-2 w-auto sm:w-full sm:max-w-sm">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={cn(
            "flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg text-sm transition-all",
            t.variant === "destructive" && "bg-red-600 border-red-600 text-white",
            t.variant === "success" && "bg-green-600 border-green-600 text-white",
            (!t.variant || t.variant === "default") && "bg-white border-gray-200 text-gray-900"
          )}
        >
          <div className="flex-1">
            {t.title && <p className="font-medium">{t.title}</p>}
            {t.description && <p className="opacity-90 text-xs mt-0.5">{t.description}</p>}
          </div>
          <button onClick={() => dismiss(t.id)} className="shrink-0 opacity-70 hover:opacity-100">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
