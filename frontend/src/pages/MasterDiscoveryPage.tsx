import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Search, Star, Clock, Flag } from "lucide-react";
import { professionalsApi } from "@/api/masters";
import { reviewsApi } from "@/api/reviews";
import { NationalitySelect } from "@/components/ui/NationalitySelect";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import type { Professional } from "@/types";

export function MasterDiscoveryPage() {
  const [search, setSearch] = useState("");
  const [nationality, setNationality] = useState("");
  const [minExperience, setMinExperience] = useState<number | "">("");
  const [filters, setFilters] = useState({ search: "", nationality: "", min_experience: undefined as number | undefined });

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
  };

  const clearFilters = () => {
    setSearch("");
    setNationality("");
    setMinExperience("");
    setFilters({ search: "", nationality: "", min_experience: undefined });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Discover Professionals</h1>
        <p className="text-muted-foreground">Find the perfect specialist for you</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
            onKeyDown={(e) => e.key === "Enter" && applyFilters()}
          />
        </div>
        <NationalitySelect
          value={nationality}
          onChange={setNationality}
        />
        <Input
          type="number"
          placeholder="Min experience (years)"
          value={minExperience}
          onChange={(e) => setMinExperience(e.target.value === "" ? "" : Number(e.target.value))}
          min={0}
        />
      </div>

      <div className="flex gap-2">
        <Button onClick={applyFilters}>Search</Button>
        {(filters.search || filters.nationality || filters.min_experience) && (
          <Button variant="outline" onClick={clearFilters}>Clear</Button>
        )}
      </div>

      {/* Results */}
      {isLoading ? (
        <Spinner className="mx-auto" />
      ) : professionals.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-lg">No professionals found</p>
          <p className="text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {professionals.map((professional: Professional) => (
            <ProfessionalCard key={professional.id} professional={professional} />
          ))}
        </div>
      )}
    </div>
  );
}

function ProfessionalCard({ professional }: { professional: Professional }) {
  const { data: stats } = useQuery({
    queryKey: ["review-stats", professional.id],
    queryFn: () => reviewsApi.masterStats(professional.id).then((r) => r.data),
    staleTime: 5 * 60 * 1000,
  });

  // Use first portfolio photo if no avatar
  const coverImage = professional.avatar_url ?? professional.photos?.[0]?.image_url;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group">
      <div className="aspect-square bg-gradient-to-br from-pink-100 to-purple-100 overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={professional.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-pink-300">
            {professional.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <h3 className="font-semibold text-base truncate">{professional.name}</h3>

        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {professional.nationality && (
            <span className="flex items-center gap-1">
              <Flag className="h-3 w-3" />
              {professional.nationality}
            </span>
          )}
          {professional.experience_years != null && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {professional.experience_years}y
            </span>
          )}
          {stats && stats.total_reviews > 0 && (
            <span className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              {stats.average_rating.toFixed(1)}
            </span>
          )}
        </div>

        {professional.bio && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{professional.bio}</p>
        )}

        <div className="mt-3 flex gap-2">
          <Link to={`/professionals/${professional.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">View Profile</Button>
          </Link>
          <Link to={`/book?professional_id=${professional.id}`} className="flex-1">
            <Button size="sm" className="w-full bg-pink-600 hover:bg-pink-700">Book</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
