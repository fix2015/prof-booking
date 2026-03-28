import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Search, MapPin, Building2, Scissors, SlidersHorizontal, UserPlus, CheckCircle2 } from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { providersApi } from "@/api/salons";
import { servicesApi } from "@/api/services";
import { professionalsApi } from "@/api/masters";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthContext } from "@/context/AuthContext";
import { toast } from "@/hooks/useToast";
import { t } from "@/i18n";
import type { Provider } from "@/types";

export function FindProvidersPage() {
  const { role } = useAuthContext();
  const navigate = useNavigate();
  const isProfessional = role === "professional";
  const [search, setSearch] = useState("");
  const [serviceName, setServiceName] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [applied, setApplied] = useState({ search: "", service_name: "" });

  const { data: serviceNames = [] } = useQuery({
    queryKey: ["services", "names"],
    queryFn: () => servicesApi.listNames(),
    staleTime: 5 * 60 * 1000,
  });

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["providers", "search", applied],
    queryFn: () => providersApi.search({ q: applied.search || undefined, service_name: applied.service_name || undefined, limit: 50 }),
  });

  const { data: myProfile } = useQuery({
    queryKey: ["professionals", "me"],
    queryFn: () => professionalsApi.getMe(),
    enabled: isProfessional,
  });

  // Set of provider IDs the professional is already linked to (any status)
  const linkedProviderIds = new Set(
    myProfile?.professional_providers?.map((pp) => pp.provider_id) ?? []
  );

  const apply = () => setApplied({ search, service_name: serviceName });
  const clear = () => { setSearch(""); setServiceName(""); setApplied({ search: "", service_name: "" }); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col overflow-x-hidden">
      <PublicHeader />

      <div className="flex-1 max-w-5xl mx-auto w-full px-4 py-4 sm:py-8 space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{t("providers.find_title")}</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {t("providers.find_subtitle")}
          </p>
        </div>

        {/* Search bar */}
        <div className="flex flex-col gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={t("providers.search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && apply()}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="gap-2 flex-1 sm:flex-none" onClick={() => setShowFilters((v) => !v)}>
              <SlidersHorizontal className="h-4 w-4" />
              {t("discover.filters")}
            </Button>
            <Button onClick={apply} className="bg-gray-900 hover:bg-gray-950 flex-1 sm:flex-none">{t("common.search")}</Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="rounded-xl border bg-muted/30 p-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{t("providers.filter_service_offered")}</label>
              <select
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">{t("providers.all_services")}</option>
                {serviceNames.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={clear}>{t("discover.filter.clear_all")}</Button>
              <Button size="sm" className="bg-gray-900 hover:bg-gray-950" onClick={apply}>{t("discover.filter.apply")}</Button>
            </div>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-20"><Spinner /></div>
        ) : providers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center gap-3">
            <div className="text-5xl">🏪</div>
            <p className="font-semibold text-lg">{t("providers.no_providers_title")}</p>
            <p className="text-sm text-muted-foreground">{t("providers.no_providers_subtitle")}</p>
            {(applied.search || applied.service_name) && (
              <Button variant="outline" size="sm" onClick={clear}>{t("discover.empty.clear")}</Button>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {providers.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                isProfessional={isProfessional}
                alreadyLinked={linkedProviderIds.has(provider.id)}
                onLoginRequired={() => navigate("/login")}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ProviderCard({ provider, isProfessional, alreadyLinked, onLoginRequired }: {
  provider: Provider;
  isProfessional: boolean;
  alreadyLinked: boolean;
  onLoginRequired: () => void;
}) {
  const [requested, setRequested] = useState(false);

  const { data: services = [] } = useQuery({
    queryKey: ["services", "provider", provider.id],
    queryFn: () => servicesApi.listByProvider(provider.id),
    staleTime: 5 * 60 * 1000,
  });

  const requestMutation = useMutation({
    mutationFn: () => professionalsApi.attachToProvider(provider.id),
    onSuccess: () => {
      setRequested(true);
      toast({ title: t("providers.request_sent_title"), description: `${provider.name} will review your application.` });
    },
    onError: (e: any) => {
      const msg = e?.response?.data?.detail ?? t("common.error");
      toast({ title: t("providers.request_failed"), description: msg, variant: "destructive" });
    },
  });

  return (
    <Card className="hover:shadow-md transition-all bg-white flex flex-col">
      <CardContent className="p-3 sm:p-4 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-2">
          {provider.logo_url ? (
            <img src={provider.logo_url} alt={provider.name}
              className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl object-cover border border-gray-200 shrink-0" />
          ) : (
            <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br from-pink-200 to-rose-300 flex items-center justify-center text-xl sm:text-2xl font-bold text-pink-800 shrink-0">
              {provider.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-sm sm:text-base leading-tight truncate">{provider.name}</h3>
            {provider.category && (
              <span className="inline-flex items-center gap-1 mt-0.5 text-xs font-medium bg-pink-50 text-pink-700 border border-pink-200 rounded-full px-2 py-0.5">
                <Building2 className="h-3 w-3" /> {provider.category}
              </span>
            )}
          </div>
        </div>

        {provider.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{provider.description}</p>
        )}

        <div className="space-y-1 text-xs text-gray-500 mb-3 min-w-0">
          {provider.address && (
            <span className="flex items-center gap-1.5 min-w-0">
              <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
              <span className="truncate">{provider.address}</span>
            </span>
          )}
          {(provider as any).professionals_count != null && (
            <span className="flex items-center gap-1.5">
              <Scissors className="h-3 w-3 text-gray-400 shrink-0" />
              {(provider as any).professionals_count !== 1
                ? t("providers.professionals_count_plural", { count: (provider as any).professionals_count })
                : t("providers.professionals_count", { count: (provider as any).professionals_count })}
            </span>
          )}
        </div>

        {services.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {services.slice(0, 4).map((s) => (
              <span key={s.id} className="inline-flex items-center text-xs bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">
                {s.name}
                {s.price ? <span className="ml-1 font-medium text-gray-800">£{s.price}</span> : null}
              </span>
            ))}
            {services.length > 4 && (
              <span className="text-xs text-muted-foreground px-1">+{services.length - 4} more</span>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-col gap-2 sm:flex-row">
          <Link to={`/providers/${provider.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full text-xs">{t("providers.view_profile")}</Button>
          </Link>
          {isProfessional ? (
            alreadyLinked ? (
              <Button size="sm" variant="outline" disabled className="flex-1 gap-1 text-xs border-green-300 text-green-700">
                <CheckCircle2 className="h-3 w-3" /> {t("providers.already_working")}
              </Button>
            ) : (
              <Button
                size="sm"
                className="flex-1 gap-1 text-xs bg-purple-700 hover:bg-purple-800"
                disabled={requested || requestMutation.isPending}
                onClick={() => requestMutation.mutate()}
              >
                {requested
                  ? <><CheckCircle2 className="h-3 w-3" /> {t("providers.requested")}</>
                  : requestMutation.isPending
                    ? <Spinner size="sm" />
                    : <><UserPlus className="h-3 w-3" /> {t("providers.request_to_work")}</>}
              </Button>
            )
          ) : (
            <Button
              size="sm"
              variant="outline"
              className="flex-1 text-xs gap-1 border-purple-300 text-purple-700 hover:bg-purple-50"
              onClick={onLoginRequired}
            >
              <UserPlus className="h-3 w-3" /> {t("providers.request_to_work")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
