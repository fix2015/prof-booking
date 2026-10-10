import { useState, useEffect } from "react";
import { NationalitySelect } from "@/components/ui/NationalitySelect";
import { DateSelect } from "@/components/mobile/DateSelect";
import { t } from "@/i18n";
import { DEFAULT_FILTERS, type FilterValues } from "@/utils/filters";

export type { FilterValues };

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  values: FilterValues;
  onApply: (values: FilterValues) => void;
  resultCount?: number;
}

const SORT_OPTIONS = [
  { label: "filters.sort.nearest" as const, value: "nearest" },
  { label: "filters.sort.top_rated" as const, value: "top_rated" },
  { label: "filters.sort.price_asc" as const, value: "price_asc" },
  { label: "filters.sort.price_desc" as const, value: "price_desc" },
];

const RATING_OPTIONS = [
  { labelKey: "filters.rating.any" as const, value: 0 },
  { labelKey: "filters.rating.3" as const, value: 3 },
  { labelKey: "filters.rating.4" as const, value: 4 },
  { labelKey: "filters.rating.45" as const, value: 4.5 },
];

const DISTANCE_OPTIONS = [0, 1, 3, 5, 10, 25];

const EXPERIENCE_OPTIONS = [
  { labelKey: "filters.exp.any" as const, value: 0 },
  { labelKey: "filters.exp.1yr" as const, value: 1 },
  { labelKey: "filters.exp.2yr" as const, value: 2 },
  { labelKey: "filters.exp.3yr" as const, value: 3 },
  { labelKey: "filters.exp.5yr" as const, value: 5 },
];

export function FilterSheet({ open, onClose, values, onApply, resultCount }: FilterSheetProps) {
  const [local, setLocal] = useState<FilterValues>(values);

  // Re-sync local state whenever the sheet opens
  useEffect(() => {
    if (open) {
      setLocal(values);
    }
  }, [open, values]);

  if (!open) return null;

  function handleApply() {
    onApply(local);
    onClose();
  }

  function handleClear() {
    setLocal({ ...DEFAULT_FILTERS });
  }

  const pillActive = "bg-ds-interactive rounded-ds-full px-[14px] py-[8px] ds-label text-ds-text-inverse";
  const pillInactive = "bg-ds-bg-primary border border-ds-border rounded-ds-full px-[14px] py-[8px] ds-label text-ds-text-secondary";

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={t("filters.title")}>
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />

      {/* Sheet panel */}
      <div className="absolute bottom-0 left-0 right-0 bg-ds-bg-primary rounded-t-ds-2xl flex flex-col gap-[14px] px-ds-5 pt-[10px] pb-[20px] max-h-[90vh] overflow-y-auto">

        {/* Drag handle */}
        <div className="flex justify-center pt-[4px]">
          <div className="w-[40px] h-[4px] bg-ds-border-strong rounded-ds-full" />
        </div>

        {/* Header row */}
        <div className="flex justify-between items-center h-[32px]">
          <span className="ds-h3 text-ds-text-primary">{t("filters.title")}</span>
          <button
            type="button"
            className="ds-label text-ds-text-muted"
            onClick={handleClear}
          >
            {t("filters.clear_all")}
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-ds-border w-full" />

        {/* Sort by */}
        <div>
          <p className="ds-label text-ds-text-primary mb-[10px]">{t("filters.sort_by")}</p>
          <div className="flex flex-wrap gap-[8px]">
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={local.sort === opt.value}
                className={local.sort === opt.value ? pillActive : pillInactive}
                onClick={() => setLocal((prev) => ({ ...prev, sort: opt.value }))}
              >
                {t(opt.label)}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-ds-border w-full" />

        {/* Open now */}
        <div className="flex items-center justify-between gap-ds-3">
          <div>
            <p className="ds-label text-ds-text-primary">{t("filters.open_now")}</p>
            <p className="ds-caption text-ds-text-secondary">{t("filters.open_now_hint")}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={local.openNow}
            aria-label={t("filters.open_now")}
            onClick={() => setLocal((prev) => ({ ...prev, openNow: !prev.openNow }))}
            className={`relative h-ds-6 w-ds-10 shrink-0 rounded-ds-full transition-colors ${local.openNow ? "bg-ds-interactive" : "bg-ds-border-strong"}`}
          >
            <span className={`absolute top-[2px] h-5 w-5 rounded-ds-full bg-ds-bg-primary transition-all ${local.openNow ? "left-[18px]" : "left-[2px]"}`} />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-ds-border w-full" />

        {/* Rating */}
        <div>
          <p className="ds-label text-ds-text-primary mb-[10px]">{t("filters.rating")}</p>
          <div className="flex flex-wrap gap-[8px]">
            {RATING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={local.minRating === opt.value}
                className={local.minRating === opt.value ? pillActive : pillInactive}
                onClick={() => setLocal((prev) => ({ ...prev, minRating: opt.value }))}
              >
                {t(opt.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-ds-border w-full" />

        {/* Distance */}
        <div>
          <p className="ds-label text-ds-text-primary mb-[10px]">{t("filters.distance")}</p>
          <div className="flex flex-wrap gap-[8px]">
            {DISTANCE_OPTIONS.map((km) => (
              <button
                key={km}
                type="button"
                aria-pressed={local.maxDistanceKm === km}
                className={local.maxDistanceKm === km ? pillActive : pillInactive}
                onClick={() => setLocal((prev) => ({ ...prev, maxDistanceKm: km }))}
              >
                {km === 0 ? t("filters.distance.any") : t("filters.distance.km", { km })}
              </button>
            ))}
          </div>
          {local.maxDistanceKm > 0 && <p className="ds-caption text-ds-text-secondary mt-ds-2">{t("filters.distance_hint")}</p>}
        </div>

        {/* Divider */}
        <div className="h-px bg-ds-border w-full" />

        {/* Date */}
        <div>
          <p className="ds-label text-ds-text-primary mb-[10px]">{t("filters.date")}</p>
          <DateSelect
            value={local.date}
            onChange={(v) => setLocal((prev) => ({ ...prev, date: v }))}
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-ds-border w-full" />

        {/* Price range */}
        <div>
          <p className="ds-label text-ds-text-primary mb-[10px]">{t("filters.price_range")}</p>
          <div className="flex items-center gap-[8px]">
            <input
              type="number"
              inputMode="decimal"
              aria-label={t("filters.price_min")}
              placeholder={t("filters.price_min")}
              value={local.minPrice}
              onChange={(e) => setLocal((prev) => ({ ...prev, minPrice: e.target.value }))}
              className="h-[44px] border border-ds-border rounded-ds-xl px-ds-4 ds-body text-ds-text-secondary flex-1 min-w-0 bg-ds-bg-primary outline-none focus:border-ds-interactive"
            />
            <span className="ds-body text-ds-text-muted">—</span>
            <input
              type="number"
              inputMode="decimal"
              aria-label={t("filters.price_max")}
              placeholder={t("filters.price_max")}
              value={local.maxPrice}
              onChange={(e) => setLocal((prev) => ({ ...prev, maxPrice: e.target.value }))}
              className="h-[44px] border border-ds-border rounded-ds-xl px-ds-4 ds-body text-ds-text-secondary flex-1 min-w-0 bg-ds-bg-primary outline-none focus:border-ds-interactive"
            />
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-ds-border w-full" />

        {/* Nationality */}
        <div>
          <p className="ds-label text-ds-text-primary mb-[10px]">{t("filters.nationality")}</p>
          <NationalitySelect
            value={local.nationality}
            onChange={(val) => setLocal((prev) => ({ ...prev, nationality: val }))}
            placeholder={t("filters.nationality_placeholder")}
          />
        </div>

        {/* Divider */}
        <div className="h-px bg-ds-border w-full" />

        {/* Min experience */}
        <div>
          <p className="ds-label text-ds-text-primary mb-[10px]">{t("filters.min_experience")}</p>
          <div className="flex flex-wrap gap-[8px]">
            {EXPERIENCE_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={local.minExperience === opt.value}
                className={local.minExperience === opt.value ? pillActive : pillInactive}
                onClick={() => setLocal((prev) => ({ ...prev, minExperience: opt.value }))}
              >
                {t(opt.labelKey)}
              </button>
            ))}
          </div>
        </div>

        {/* Show results button */}
        <button
          type="button"
          className="w-full h-[50px] bg-ds-interactive rounded-ds-2xl ds-body-large text-ds-text-inverse mt-[6px]"
          onClick={handleApply}
        >
          {t("filters.show_results", { count: resultCount ?? 0 })}
        </button>
      </div>
    </div>
  );
}
