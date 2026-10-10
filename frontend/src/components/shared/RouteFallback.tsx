import { t } from "@/i18n";

/** Placeholder while a lazily loaded page chunk downloads. */
export function RouteFallback({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <div
      className={`${fullScreen ? "min-h-screen bg-ds-bg-secondary" : "min-h-[40vh]"} flex items-center justify-center`}
      role="status"
      aria-live="polite"
    >
      <div className="h-6 w-6 border-2 border-ds-interactive border-t-transparent rounded-ds-full animate-spin" aria-hidden />
      <span className="sr-only">{t("common.loading")}</span>
    </div>
  );
}
