import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePublicProviders } from "@/hooks/useSalon";
import { AppHeader } from "@/components/mobile/AppHeader";
import { CategoryChip } from "@/components/mobile/CategoryChip";
import { ProviderCard } from "@/components/mobile/ProviderCard";
import { SearchBar } from "@/components/mobile/SearchBar";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { t, TranslationKey } from "@/i18n";

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

// value = English key used for filter matching; labelKey = i18n key for display
const CATEGORIES: { value: string; labelKey: TranslationKey }[] = [
  { value: "All",         labelKey: "providers.category.all" },
  { value: "Beauty",      labelKey: "providers.category.beauty" },
  { value: "Nails",       labelKey: "providers.category.nails" },
  { value: "Hair",        labelKey: "providers.category.hair" },
  { value: "Massage",     labelKey: "providers.category.massage" },
  { value: "Cleaning",    labelKey: "providers.category.cleaning" },
  { value: "Auto Repair", labelKey: "providers.category.auto_repair" },
];

export function SalonSelectorPage() {
  const navigate = useNavigate();
  const { data: providers = [], isLoading } = usePublicProviders();
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [saved, setSaved] = useState<number[]>(getSaved);

  const filtered = useMemo(() => {
    return providers.filter((p) => {
      const matchesSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        (p.address ?? "").toLowerCase().includes(search.toLowerCase());
      const matchesCategory =
        activeCategory === "All" ||
        (p.category ?? "").toLowerCase() === activeCategory.toLowerCase();
      return matchesSearch && matchesCategory;
    });
  }, [providers, search, activeCategory]);

  function handleToggleSave(id: number) {
    setSaved(toggleSaved(id));
  }

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
        <div className="flex items-center gap-ds-2 mt-ds-3 overflow-x-auto scrollbar-none pb-[2px]">
          <Button variant="default" size="sm" className="shrink-0 h-[32px] rounded-ds-full px-ds-3 gap-ds-1">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 3h12M3 7h8M5 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {t("discover.filters")}
          </Button>
          <Button variant="outline" size="sm" className="shrink-0 h-[32px] rounded-ds-full px-ds-3">
            {t("providers.price_filter")}
          </Button>
          <Button variant="outline" size="sm" className="shrink-0 h-[32px] rounded-ds-full px-ds-3">
            {t("discover.filter.nationality")}
          </Button>
        </div>
      </div>

      {/* Category chips */}
      <div className="flex gap-ds-2 px-ds-4 py-ds-3 overflow-x-auto scrollbar-none bg-ds-bg-primary border-b border-ds-border">
        {CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat.value}
            label={t(cat.labelKey)}
            active={activeCategory === cat.value}
            onClick={() => setActiveCategory(cat.value)}
          />
        ))}
        <button
          type="button"
          className="shrink-0 h-[32px] px-ds-3 rounded-ds-full border border-dashed border-ds-border ds-badge text-ds-text-secondary whitespace-nowrap"
        >
          {t("providers.more_categories")}
        </button>
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
    </div>
  );
}
