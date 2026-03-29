import { useState, useEffect } from "react";
import { NationalitySelect } from "@/components/ui/NationalitySelect";
import { DateSelect } from "@/components/mobile/DateSelect";
import { t } from "@/i18n";

export interface FilterValues {
  sort: string;
  date: string;
  minPrice: string;
  maxPrice: string;
  nationality: string;
  minExperience: number;
}

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
    setLocal({ sort: "nearest", date: "", minPrice: "", maxPrice: "", nationality: "", minExperience: 0 });
  }

  const pillActive = "bg-ds-interactive rounded-ds-full px-[14px] py-[8px] ds-label text-ds-text-inverse";
  const pillInactive = "bg-ds-bg-primary border border-ds-border rounded-ds-full px-[14px] py-[8px] ds-label text-ds-text-secondary";

  return (
    <div className="fixed inset-0 z-50">
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
              placeholder={t("filters.price_min")}
              value={local.minPrice}
              onChange={(e) => setLocal((prev) => ({ ...prev, minPrice: e.target.value }))}
              className="h-[44px] border border-ds-border rounded-ds-xl px-ds-4 ds-body text-ds-text-secondary flex-1 bg-ds-bg-primary outline-none focus:border-ds-interactive"
            />
            <span className="ds-body text-ds-text-muted">—</span>
            <input
              type="number"
              placeholder={t("filters.price_max")}
              value={local.maxPrice}
              onChange={(e) => setLocal((prev) => ({ ...prev, maxPrice: e.target.value }))}
              className="h-[44px] border border-ds-border rounded-ds-xl px-ds-4 ds-body text-ds-text-secondary flex-1 bg-ds-bg-primary outline-none focus:border-ds-interactive"
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
