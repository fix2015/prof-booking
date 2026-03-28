import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useSearchProviders, useProviderCategories } from "@/hooks/useSalon";
import { AppHeader } from "@/components/mobile/AppHeader";
import { CategoryChip } from "@/components/mobile/CategoryChip";
import { ProviderCard } from "@/components/mobile/ProviderCard";
import { SearchBar } from "@/components/mobile/SearchBar";
import { FilterBar } from "@/components/mobile/FilterBar";
import { FilterSheet, FilterValues } from "@/components/mobile/FilterSheet";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { t } from "@/i18n";

const SAVED_KEY = "pb_saved";

function getSaved(): number[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function toggleSaved(id: number): number[] {
  const current = getSaved();
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  return next;
}

export function SalonSelectorPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [saved, setSaved] = useState<number[]>(getSaved);
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<FilterValues>({
    sort: "nearest",
    date: "",
    minPrice: "",
    maxPrice: "",
    nationality: "",
    minExperience: 0,
  });

  const { data: categories = [] } = useProviderCategories();

  const { data: providers = [], isLoading } = useSearchProviders({
    q: search || undefined,
    category: activeCategory,
    sort: filters.sort || undefined,
    date: filters.date || undefined,
    minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
    maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
    nationality: filters.nationality || undefined,
    minExperience: filters.minExperience || undefined,
  });

  // BE already filters by category; `providers` is the final result
  const filtered = providers;

  function handleToggleSave(id: number) {
    setSaved(toggleSaved(id));
  }

  const hasActiveFilters =
    filters.sort !== "nearest" ||
    !!filters.date ||
    !!filters.minPrice ||
    !!filters.maxPrice ||
    !!filters.nationality ||
    !!filters.minExperience;

  const HeaderRight = (
    <div className="flex items-center gap-ds-2">
      <LanguageSwitcher />
      <Button
        variant="outline"
        size="sm"
        className="h-[32px] rounded-ds-full px-ds-3 ds-label-small"
        onClick={() => navigate("/login")}
      >
        {t("providers.sign_in")}
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-full bg-ds-bg-secondary">
      <AppHeader variant="brand" rightElement={HeaderRight} />

      {/* Search section */}
      <div className="px-ds-4 pt-ds-5 pb-ds-3 bg-ds-bg-primary">
        <h1 className="ds-h1 text-ds-text-primary mb-ds-3">{t("providers.find_nearby")}</h1>

        {/* Search pill */}
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={t("providers.search_placeholder")}
        />

        {/* Filter bar */}
        <FilterBar
          onOpenFilters={() => setFilterOpen(true)}
          hasActiveFilters={hasActiveFilters}
          activeNationality={filters.nationality}
          activePriceRange={
            filters.minPrice || filters.maxPrice
              ? {
                  min: Number(filters.minPrice) || undefined,
                  max: Number(filters.maxPrice) || undefined,
                }
              : undefined
          }
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-ds-2 px-ds-4 py-ds-3 overflow-x-auto scrollbar-none bg-ds-bg-primary border-b border-ds-border">
        <CategoryChip
          key="All"
          label={t("providers.category.all")}
          active={activeCategory === "All"}
          onClick={() => setActiveCategory("All")}
        />
        {categories.map((cat) => (
          <CategoryChip
            key={cat}
            label={cat}
            active={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
          />
        ))}
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between px-ds-4 py-ds-2">
        <span className="ds-body-small text-ds-text-secondary">
          {isLoading ? t("common.loading") : t("providers.count", { count: filtered.length })}
        </span>
        <Button variant="ghost" size="sm" className="ds-body-small text-ds-interactive h-auto py-0 px-0">
          {t("providers.sort")}
        </Button>
      </div>

      {/* Provider list */}
      <div className="flex flex-col gap-ds-3 px-ds-4 pb-ds-4">
        {isLoading ? (
          Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-[100px] bg-ds-bg-primary rounded-ds-2xl border border-ds-border animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-ds-12">
            <p className="ds-body text-ds-text-secondary">{t("providers.no_providers")}</p>
          </div>
        ) : (
          filtered.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
              variant="list"
              saved={saved.includes(provider.id)}
              onToggleSave={handleToggleSave}
              onClick={(id) => navigate(`/providers/${id}`)}
            />
          ))
        )}
      </div>

      <FilterSheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        values={filters}
        onApply={(v) => { setFilters(v); setFilterOpen(false); }}
        resultCount={filtered.length}
      />
    </div>
  );
}
