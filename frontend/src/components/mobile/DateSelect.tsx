import { t } from "@/i18n";

interface Props {
  value: string; // ISO date "YYYY-MM-DD" or ""
  onChange: (value: string) => void;
  placeholder?: string;
  min?: string; // ISO date string, defaults to today
}

function formatDisplay(iso: string): string {
  if (!iso) return "";
  const [year, month, day] = iso.split("-");
  return `${day}/${month}/${year}`;
}

export function DateSelect({ value, onChange, placeholder, min }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const hasValue = !!value;

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  return (
    <div className="relative w-full">
      {/* Visual display layer (pointer-events-none so clicks fall through to the input) */}
      <div className="pointer-events-none flex items-center gap-[10px] h-[44px] w-full border border-ds-border bg-ds-bg-primary rounded-ds-xl px-[14px] py-[12px] ds-body text-left">
        {/* Calendar icon */}
        <svg
          width="16" height="16" viewBox="0 0 16 16" fill="none"
          className="shrink-0 text-ds-text-muted"
        >
          <rect x="1" y="2" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5 1v2M11 1v2M1 6h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>

        {/* Label */}
        <span className={`flex-1 truncate ${hasValue ? "text-ds-text-primary" : "text-ds-text-muted"}`}>
          {hasValue ? formatDisplay(value) : (placeholder ?? t("filters.date_placeholder"))}
        </span>

        {/* Chevron */}
        {!hasValue && <span className="shrink-0 ds-body-medium text-ds-border-strong">›</span>}
      </div>

      {/* Native date input overlaid on top — transparent, full-area tap target on mobile */}
      <input
        type="date"
        value={value}
        min={min ?? today}
        onChange={(e) => onChange(e.target.value)}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />

      {/* Clear button — rendered on top of the native input so it stays tappable */}
      {hasValue && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear date"
          className="absolute right-[14px] top-1/2 -translate-y-1/2 z-10 text-ds-text-secondary hover:text-ds-text-primary"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </button>
      )}
    </div>
  );
}
