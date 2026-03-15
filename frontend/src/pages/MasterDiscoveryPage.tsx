import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Star, Clock, X, SlidersHorizontal, ArrowRight } from "lucide-react";
import { professionalsApi } from "@/api/masters";
import { reviewsApi } from "@/api/reviews";
import { NATIONALITIES } from "@/components/ui/NationalitySelect";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Professional } from "@/types";

const flagFor = (nat: string) =>
  NATIONALITIES.find((n) => n.label.toLowerCase() === nat.toLowerCase())?.flag ?? "🌍";

export function MasterDiscoveryPage() {
  const [search, setSearch] = useState("");
  const [nationality, setNationality] = useState("");
  const [minExperience, setMinExperience] = useState<number | "">("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: "",
    nationality: "",
    min_experience: undefined as number | undefined,
  });

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ["professionals", "discover", filters],
    queryFn: () =>
      professionalsApi.discover({
        search: filters.search || undefined,
        nationality: filters.nationality || undefined,
        min_experience: filters.min_experience,
        limit: 24,
      }),
  });

  const applyFilters = () => {
    setFilters({
      search,
      nationality,
      min_experience: minExperience !== "" ? Number(minExperience) : undefined,
    });
    setShowFilters(false);
  };

  const clearFilters = () => {
    setSearch("");
    setNationality("");
    setMinExperience("");
    setFilters({ search: "", nationality: "", min_experience: undefined });
  };

  const hasActiveFilters = !!(filters.search || filters.nationality || filters.min_experience);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
      {/* Top nav */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur border-b px-4 py-3 flex items-center justify-between">
        <Link to="/providers" className="text-lg font-bold tracking-tight text-gray-900">
          ProBook
        </Link>
        <div className="flex items-center gap-2">
          <Link to="/providers">
            <Button variant="ghost" size="sm">Find Salons</Button>
          </Link>
          <Link to="/login">
            <Button size="sm" className="bg-gray-900 hover:bg-gray-950 gap-1.5">
              Sign in <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </header>

      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-8 space-y-6">
      {/* Page header */}
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Discover Professionals</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Browse and book top-rated specialists
          </p>
        </div>
        {professionals.length > 0 && (
          <p className="text-sm text-muted-foreground">{professionals.length} found</p>
        )}
      </div>

      {/* Search + filter bar */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
            className="pl-9"
          />
        </div>
        <Button
          variant="outline"
          className="gap-2 shrink-0"
          onClick={() => setShowFilters((v) => !v)}
        >
          <SlidersHorizontal className="h-4 w-4" />
          <span className="hidden sm:inline">Filters</span>
          {hasActiveFilters && (
            <span className="ml-0.5 inline-flex items-center justify-center h-4 w-4 rounded-full bg-gray-900 text-white text-[10px] font-bold">
              {[filters.nationality, filters.min_experience].filter(Boolean).length}
            </span>
          )}
        </Button>
        <Button onClick={applyFilters} className="bg-gray-900 hover:bg-gray-950 shrink-0">
          Search
        </Button>
      </div>

      {/* Expandable filters */}
      {showFilters && (
        <div className="rounded-xl border bg-muted/30 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Nationality</label>
            <select
              value={nationality}
              onChange={(e) => setNationality(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All nationalities</option>
              {NATIONALITIES.map((n) => (
                <option key={n.label} value={n.label}>
                  {n.flag} {n.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Min. Experience
            </label>
            <Input
              type="number"
              placeholder="e.g. 3 years"
              value={minExperience}
              onChange={(e) =>
                setMinExperience(e.target.value === "" ? "" : Number(e.target.value))
              }
              min={0}
            />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
            <Button size="sm" className="bg-gray-900 hover:bg-gray-950" onClick={applyFilters}>
              Apply
            </Button>
          </div>
        </div>
      )}

      {/* Active filter chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2">
          {filters.search && (
            <Chip label={`"${filters.search}"`} onRemove={() => { setSearch(""); setFilters((f) => ({ ...f, search: "" })); }} />
          )}
          {filters.nationality && (
            <Chip label={`${flagFor(filters.nationality)} ${filters.nationality}`} onRemove={() => { setNationality(""); setFilters((f) => ({ ...f, nationality: "" })); }} />
          )}
          {filters.min_experience && (
            <Chip label={`${filters.min_experience}+ yrs exp`} onRemove={() => { setMinExperience(""); setFilters((f) => ({ ...f, min_experience: undefined })); }} />
          )}
          <button onClick={clearFilters} className="text-xs text-muted-foreground hover:text-foreground underline">
            Clear all
          </button>
        </div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : professionals.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
          <div className="text-5xl">🔍</div>
          <p className="font-semibold text-lg">No professionals found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filters</p>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {professionals.map((professional: Professional) => (
            <ProfessionalCard key={professional.id} professional={professional} />
          ))}
        </div>
      )}
      </div>
    </div>
  );
}

function Chip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
      {label}
      <button onClick={onRemove} className="hover:text-gray-900 ml-0.5">
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

function ProfessionalCard({ professional }: { professional: Professional }) {
  const { data: stats } = useQuery({
    queryKey: ["review-stats", professional.id],
    queryFn: () => reviewsApi.masterStats(professional.id).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const coverImage = professional.avatar_url ?? professional.photos?.[0]?.image_url;
  const initials = professional.name.charAt(0).toUpperCase();

  return (
    <div className="group rounded-2xl border bg-white overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex flex-col">
      {/* Cover image */}
      <div className="relative aspect-[4/3] bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={professional.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-gray-300 select-none">
            {initials}
          </div>
        )}
        {/* Rating badge */}
        {stats && stats.total_reviews > 0 && (
          <div className="absolute top-2 right-2 flex items-center gap-1 rounded-full bg-white/90 backdrop-blur-sm px-2 py-0.5 text-xs font-semibold shadow-sm">
            <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
            {stats.average_rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        <div>
          <h3 className="font-semibold text-base leading-tight truncate">{professional.name}</h3>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {professional.nationality && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                {flagFor(professional.nationality)} {professional.nationality}
              </span>
            )}
            {professional.experience_years != null && (
              <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                <Clock className="h-3 w-3" />
                {professional.experience_years}y exp
              </span>
            )}
          </div>
        </div>

        {professional.bio && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {professional.bio}
          </p>
        )}

        <div className="mt-auto flex gap-2">
          <Link to={`/professionals/${professional.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">
              Profile
            </Button>
          </Link>
          <Link to={`/book?professional_id=${professional.id}`} className="flex-1">
            <Button size="sm" className="w-full bg-gray-900 hover:bg-gray-950">
              Book
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
