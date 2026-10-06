import { t } from "@/i18n";

/** Marks demo/sample listings so visitors never mistake them for real businesses. */
export function SampleBadge({ className = "" }: { className?: string }) {
  return (
    <span
      title={t("sample.tooltip")}
      className={`inline-flex items-center rounded-ds-xs bg-ds-feedback-warning-bg px-ds-2 py-[3px] ds-badge text-ds-feedback-warning ${className}`}
    >
      {t("sample.badge")}
    </span>
  );
}
