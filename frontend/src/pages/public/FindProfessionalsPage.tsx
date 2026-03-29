import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Clock, Flag, SlidersHorizontal } from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { professionalsApi } from "@/api/masters";
import { reviewsApi } from "@/api/reviews";
import { NATIONALITIES } from "@/components/ui/NationalitySelect";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { t } from "@/i18n";
import type { Professional } from "@/types";

const flagFor = (nat: string) =>
  NATIONALITIES.find((n) => n.label.toLowerCase() === nat.toLowerCase())?.flag ?? "🌍";

export function FindProfessionalsPage() {
  const [search, setSearch] = useState("");
  const [nationality, setNationality] = useState("");
  const [minExperience, setMinExperience] = useState<number | "">("");
  const [serviceName, setServiceName] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [applied, setApplied] = useState({
    search: "",
    nationality: "",
    min_experience: undefined as number | undefined,
    service_name: "",
  });

  const { data: professionals = [], isLoading } = useQuery({
    queryKey: ["professionals", "find", applied],
    queryFn: () =>
      professionalsApi.discover({
        search: applied.search || undefined,
        nationality: applied.nationality || undefined,
        min_experience: applied.min_experience,
        service_name: applied.service_name || undefined,
        limit: 48,
      }),
  });

  const apply = () =>
    setApplied({
      search,
      nationality,
      min_experience: minExperience !== "" ? Number(minExperience) : undefined,
      service_name: serviceName,
    });

  const clear = () => {
    setSearch(""); setNationality(""); setMinExperience(""); setServiceName("");
    setApplied({ search: "", nationality: "", min_experience: undefined, service_name: "" });
  };

  const activeFilterCount = [applied.nationality, applied.min_experience, applied.service_name].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-ds-bg-secondary flex flex-col">
      <PublicHeader />

      <div className="flex-1 max-w-6xl mx-auto w-full px-ds-4 py-ds-8 space-y-ds-6">
        <div className="flex items-end justify-between gap-ds-4 flex-wrap">
          <div>
            <h1 className="ds-h1 text-ds-text-primary">{t("professionals.find_title")}</h1>
            <p className="ds-body-small text-ds-text-secondary mt-[2px]">
              {t("professionals.find_subtitle")}
            </p>
          </div>
          {professionals.length > 0 && (
            <p className="ds-body-small text-ds-text-secondary">{t("professionals.found", { count: professionals.length })}</p>
          )}
        </div>

        {/* Search bar */}
        <div className="flex gap-ds-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ds-text-muted pointer-events-none" />
            <Input
              placeholder={t("professionals.search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && apply()}
              className="pl-9"
            />
          </div>
          <Button
            variant="outline"
            className="gap-ds-2 shrink-0"
            onClick={() => setShowFilters((v) => !v)}
          >
            <SlidersHorizontal className="h-4 w-4" />
            <span className="hidden sm:inline">{t("discover.filters")}</span>
            {activeFilterCount > 0 && (
              <span className="ml-[2px] inline-flex items-center justify-center h-4 w-4 rounded-ds-full bg-ds-interactive text-ds-text-inverse ds-badge font-bold">
                {activeFilterCount}
              </span>
            )}
          </Button>
          <Button onClick={apply} className="bg-ds-interactive hover:bg-ds-interactive-hover shrink-0">{t("common.search")}</Button>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="rounded-ds-xl border border-ds-border bg-ds-bg-tertiary p-ds-4 grid grid-cols-1 sm:grid-cols-3 gap-ds-3">
            <div className="space-y-[6px]">
              <label className="ds-label-small text-ds-text-muted uppercase tracking-wide">{t("professionals.filter_nationality")}</label>
              <select
                value={nationality}
                onChange={(e) => setNationality(e.target.value)}
                className="w-full rounded-ds-md border border-ds-border bg-ds-bg-primary px-ds-3 py-ds-2 ds-body text-ds-text-secondary focus:outline-none focus:border-ds-interactive"
              >
                <option value="">{t("discover.filter.all_nationalities")}</option>
                {NATIONALITIES.map((n) => (
                  <option key={n.label} value={n.label}>{n.flag} {n.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-[6px]">
              <label className="ds-label-small text-ds-text-muted uppercase tracking-wide">{t("professionals.filter_min_experience")}</label>
              <Input
                type="number"
                placeholder="e.g. 2"
                value={minExperience}
                onChange={(e) => setMinExperience(e.target.value === "" ? "" : Number(e.target.value))}
                min={0}
              />
            </div>
            <div className="space-y-[6px]">
              <label className="ds-label-small text-ds-text-muted uppercase tracking-wide">{t("professionals.filter_service")}</label>
              <Input
                placeholder="e.g. Gel Manicure"
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && apply()}
              />
            </div>
            <div className="sm:col-span-3 flex justify-end gap-ds-2">
              <Button variant="ghost" size="sm" onClick={clear}>{t("discover.filter.clear_all")}</Button>
              <Button size="sm" className="bg-ds-interactive hover:bg-ds-interactive-hover" onClick={apply}>{t("discover.filter.apply")}</Button>
            </div>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-ds-10"><Spinner /></div>
        ) : professionals.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-ds-10 text-center gap-ds-3">
            <div className="text-[4rem]">🔍</div>
            <p className="ds-h4 text-ds-text-primary">{t("professionals.no_title")}</p>
            <p className="ds-body text-ds-text-secondary">{t("professionals.no_subtitle")}</p>
            {(applied.search || activeFilterCount > 0) && (
              <Button variant="outline" size="sm" onClick={clear}>{t("discover.empty.clear")}</Button>
            )}
          </div>
        ) : (
          <div className="grid gap-ds-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {professionals.map((p) => (
              <ProfessionalCard key={p.id} professional={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfessionalCard({ professional }: { professional: Professional }) {
  const { data: stats } = useQuery({
    queryKey: ["review-stats", professional.id],
    queryFn: () => reviewsApi.masterStats(professional.id).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  const coverImage = professional.avatar_url ?? professional.photos?.[0]?.image_url;

  return (
    <div className="group rounded-ds-2xl border border-ds-border bg-ds-bg-primary overflow-hidden hover:shadow-lg transition-all duration-200 hover:-translate-y-0.5 flex flex-col">
      {/* Cover image */}
      <div className="relative aspect-[4/3] bg-ds-bg-tertiary overflow-hidden">
        {coverImage ? (
          <img src={coverImage} alt={professional.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[4rem] font-bold text-ds-text-disabled select-none">
            {professional.name.charAt(0).toUpperCase()}
          </div>
        )}
        {stats && stats.total_reviews > 0 && (
          <div className="absolute top-ds-2 right-ds-2 flex items-center gap-[4px] rounded-ds-full bg-ds-bg-primary/90 backdrop-blur-sm px-ds-2 py-[2px] ds-caption font-semibold shadow-sm">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="var(--ds-feedback-rating)">
              <path d="M6 1l1.2 2.6L10 4.1l-2 1.9.5 2.7L6 7.4 3.5 8.7l.5-2.7L2 4.1l2.8-.5L6 1Z" />
            </svg>
            {stats.average_rating.toFixed(1)}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-ds-4 gap-ds-3">
        <div>
          <h3 className="ds-body-strong text-ds-text-primary truncate">{professional.name}</h3>
          <div className="mt-[6px] flex flex-wrap gap-[6px]">
            {professional.nationality && (
              <span className="inline-flex items-center gap-[4px] rounded-ds-full bg-ds-bg-tertiary px-ds-2 py-[2px] ds-badge text-ds-text-secondary">
                <Flag className="h-3 w-3" /> {flagFor(professional.nationality)} {professional.nationality}
              </span>
            )}
            {professional.experience_years != null && (
              <span className="inline-flex items-center gap-[4px] rounded-ds-full bg-ds-bg-tertiary px-ds-2 py-[2px] ds-badge text-ds-text-secondary">
                <Clock className="h-3 w-3" /> {professional.experience_years}y exp
              </span>
            )}
          </div>
        </div>

        {professional.bio && (
          <p className="ds-caption text-ds-text-secondary line-clamp-2">{professional.bio}</p>
        )}

        <div className="mt-auto flex gap-ds-2">
          <Link to={`/professionals/${professional.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">{t("professionals.view_profile")}</Button>
          </Link>
          <Link to={`/book?professional_id=${professional.id}`} className="flex-1">
            <Button size="sm" className="w-full bg-ds-interactive hover:bg-ds-interactive-hover">{t("professionals.book")}</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
