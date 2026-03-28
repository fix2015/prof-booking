import { Button } from "@/components/ui/button";
import { t } from "@/i18n";

interface FilterBarProps {
  onOpenFilters: () => void;
  hasActiveFilters?: boolean;
  activeNationality?: string;
  activePriceRange?: { min?: number; max?: number };
  onOpenPrice?: () => void;
  onOpenNationality?: () => void;
}

export function FilterBar({
  onOpenFilters,
  hasActiveFilters,
  activeNationality,
  activePriceRange,
}: FilterBarProps) {
  return (
    <div className="flex items-center gap-ds-2 mt-ds-3 overflow-x-auto scrollbar-none pb-[2px]">
      {/* Filters button */}
      <Button
        variant={hasActiveFilters ? "default" : "default"}
        size="sm"
        className="shrink-0 h-[32px] rounded-ds-full px-ds-3 gap-ds-1"
        onClick={onOpenFilters}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M1 3h12M3 7h8M5 11h4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        {t("filters.title")}
      </Button>

      {/* Price button */}
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 h-[32px] rounded-ds-full px-ds-3"
        onClick={onOpenFilters}
      >
        {activePriceRange?.min != null || activePriceRange?.max != null
          ? `£${activePriceRange?.min ?? 0}–£${activePriceRange?.max ?? "∞"}`
          : t("providers.price_filter")}
      </Button>

      {/* Nationality button */}
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 h-[32px] rounded-ds-full px-ds-3"
        onClick={onOpenFilters}
      >
        {activeNationality || t("discover.filter.nationality")}
      </Button>
    </div>
  );
}
