import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePublicProviders } from "@/hooks/useSalon";
import { AppHeader } from "@/components/mobile/AppHeader";
import { CategoryChip } from "@/components/mobile/CategoryChip";
import { ProviderCard } from "@/components/mobile/ProviderCard";

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

const CATEGORIES = ["All", "Beauty", "Nails", "Hair", "Massage", "Cleaning", "Auto Repair"];

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

  const SignInButton = (
    <button
      onClick={() => navigate("/login")}
      className="px-ds-3 h-[32px] rounded-ds-full border border-ds-border ds-label-small text-ds-text-primary"
    >
      Sign In
    </button>
  );

  return (
    <div className="flex flex-col min-h-full bg-ds-bg-secondary">
      <AppHeader variant="brand" rightElement={SignInButton} />

      {/* Search */}
      <div className="px-ds-4 pt-ds-4 pb-ds-2">
        <div className="flex items-center gap-ds-2 bg-ds-bg-primary rounded-ds-xl border border-ds-border px-ds-3 h-[44px]">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 text-ds-text-secondary">
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <input
            className="flex-1 bg-transparent outline-none ds-body text-ds-text-primary placeholder:text-ds-text-disabled"
            placeholder="Search providers, services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-ds-text-secondary">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Category chips */}
      <div className="flex gap-ds-2 px-ds-4 pb-ds-3 overflow-x-auto scrollbar-none">
        {CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat}
            label={cat}
            active={activeCategory === cat}
            onClick={() => setActiveCategory(cat)}
          />
        ))}
      </div>

      {/* Results header */}
      <div className="flex items-center justify-between px-ds-4 pb-ds-2">
        <span className="ds-body-small text-ds-text-secondary">
          {isLoading ? "Loading..." : `${filtered.length} providers`}
        </span>
        <button className="ds-body-small text-ds-interactive">Sort</button>
      </div>

      {/* Provider list */}
      <div className="flex flex-col gap-ds-3 px-ds-4 pb-ds-4">
        {isLoading ? (
          Array.from({ length: 4 }, (_, i) => (
            <div key={i} className="h-[200px] bg-ds-bg-primary rounded-ds-2xl border border-ds-border animate-pulse" />
          ))
        ) : filtered.length === 0 ? (
          <div className="text-center py-ds-12">
            <p className="ds-body text-ds-text-secondary">No providers found</p>
          </div>
        ) : (
          filtered.map((provider) => (
            <ProviderCard
              key={provider.id}
              provider={provider}
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
