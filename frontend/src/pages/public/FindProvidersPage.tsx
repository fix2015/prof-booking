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

  const linkedProviderIds = new Set(
    myProfile?.professional_providers?.map((pp) => pp.provider_id) ?? []
  );

  const apply = () => setApplied({ search, service_name: serviceName });
  const clear = () => { setSearch(""); setServiceName(""); setApplied({ search: "", service_name: "" }); };

  return (
    <div className="min-h-screen bg-ds-bg-secondary flex flex-col overflow-x-hidden">
      <PublicHeader />

      <div className="flex-1 max-w-5xl mx-auto w-full px-ds-4 py-ds-4 sm:py-ds-8 space-y-ds-4 sm:space-y-ds-6">
        <div>
          <h1 className="ds-h1 text-ds-text-primary">{t("providers.find_title")}</h1>
          <p className="ds-body-small text-ds-text-secondary mt-[2px]">
            {t("providers.find_subtitle")}
          </p>
        </div>

        {/* Search bar */}
        <div className="flex flex-col gap-ds-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-ds-text-muted pointer-events-none" />
            <Input
              placeholder={t("providers.search_placeholder")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && apply()}
              className="pl-9"
            />
          </div>
          <div className="flex gap-ds-2">
            <Button variant="outline" className="gap-ds-2 flex-1 sm:flex-none" onClick={() => setShowFilters((v) => !v)}>
              <SlidersHorizontal className="h-4 w-4" />
              {t("discover.filters")}
            </Button>
            <Button onClick={apply} className="bg-ds-interactive hover:bg-ds-interactive-hover flex-1 sm:flex-none">{t("common.search")}</Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="rounded-ds-xl border border-ds-border bg-ds-bg-tertiary p-ds-4 grid grid-cols-1 sm:grid-cols-2 gap-ds-3">
            <div className="space-y-[6px]">
              <label className="ds-label-small text-ds-text-muted uppercase tracking-wide">{t("providers.filter_service_offered")}</label>
              <select
                value={serviceName}
                onChange={(e) => setServiceName(e.target.value)}
                className="w-full rounded-ds-md border border-ds-border bg-ds-bg-primary px-ds-3 py-ds-2 ds-body text-ds-text-secondary focus:outline-none focus:border-ds-interactive"
              >
                <option value="">{t("providers.all_services")}</option>
                {serviceNames.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 flex justify-end gap-ds-2">
              <Button variant="ghost" size="sm" onClick={clear}>{t("discover.filter.clear_all")}</Button>
              <Button size="sm" className="bg-ds-interactive hover:bg-ds-interactive-hover" onClick={apply}>{t("discover.filter.apply")}</Button>
            </div>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="flex justify-center py-ds-10"><Spinner /></div>
        ) : providers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-ds-10 text-center gap-ds-3">
            <div className="text-[4rem]">🏪</div>
            <p className="ds-h4 text-ds-text-primary">{t("providers.no_providers_title")}</p>
            <p className="ds-body text-ds-text-secondary">{t("providers.no_providers_subtitle")}</p>
            {(applied.search || applied.service_name) && (
              <Button variant="outline" size="sm" onClick={clear}>{t("discover.empty.clear")}</Button>
            )}
          </div>
        ) : (
          <div className="grid gap-ds-4 sm:grid-cols-2 lg:grid-cols-3">
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
    <Card className="hover:shadow-md transition-all bg-ds-bg-primary flex flex-col overflow-hidden">
      <CardContent className="p-ds-3 sm:p-ds-4 flex flex-col flex-1">
        <div className="flex items-center gap-ds-3 mb-ds-2">
          {provider.logo_url ? (
            <img src={provider.logo_url} alt={provider.name}
              className="w-11 h-11 rounded-ds-xl object-cover border border-ds-border shrink-0" />
          ) : (
            <div className="w-11 h-11 rounded-ds-xl bg-ds-avatar-teal flex items-center justify-center text-xl font-bold text-ds-text-inverse shrink-0">
              {provider.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h3 className="ds-body-strong text-ds-text-primary truncate">{provider.name}</h3>
            {provider.category && (
              <span className="inline-flex items-center gap-[4px] mt-[2px] ds-badge text-ds-text-secondary bg-ds-bg-tertiary border border-ds-border rounded-ds-full px-ds-2 py-[2px] max-w-full overflow-hidden">
                <Building2 className="h-3 w-3 shrink-0" /> <span className="truncate">{provider.category}</span>
              </span>
            )}
          </div>
        </div>

        {provider.description && (
          <p className="ds-caption text-ds-text-secondary line-clamp-1 mb-ds-2">{provider.description}</p>
        )}

        <div className="space-y-[4px] mb-ds-3 min-w-0">
          {provider.address && (
            <span className="flex items-center gap-[6px] min-w-0">
              <MapPin className="h-3 w-3 text-ds-text-muted shrink-0" />
              <span className="ds-caption text-ds-text-secondary truncate">{provider.address}</span>
            </span>
          )}
          {(provider as any).professionals_count != null && (
            <span className="flex items-center gap-[6px]">
              <Scissors className="h-3 w-3 text-ds-text-muted shrink-0" />
              <span className="ds-caption text-ds-text-secondary">
                {(provider as any).professionals_count !== 1
                  ? t("providers.professionals_count_plural", { count: (provider as any).professionals_count })
                  : t("providers.professionals_count", { count: (provider as any).professionals_count })}
              </span>
            </span>
          )}
        </div>

        {services.length > 0 && (
          <div className="flex flex-wrap gap-[4px] mb-ds-3">
            {services.slice(0, 3).map((s) => (
              <span key={s.id} className="inline-flex items-center gap-[2px] ds-badge bg-ds-bg-tertiary text-ds-text-secondary rounded-ds-full px-ds-2 py-[2px] max-w-[calc(50%-2px)] overflow-hidden">
                <span className="truncate">{s.name}</span>
                {s.price ? <span className="font-medium text-ds-text-primary shrink-0">£{s.price}</span> : null}
              </span>
            ))}
            {services.length > 3 && (
              <span className="ds-caption text-ds-text-muted px-[4px] self-center">+{services.length - 3}</span>
            )}
          </div>
        )}

        <div className="mt-auto flex flex-row gap-ds-2">
          <Link to={`/providers/${provider.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">{t("providers.view_profile")}</Button>
          </Link>
          {isProfessional ? (
            alreadyLinked ? (
              <Button size="sm" variant="outline" disabled className="flex-1 gap-[4px] border-[var(--ds-feedback-success)] text-[var(--ds-feedback-success)]">
                <CheckCircle2 className="h-3 w-3" /> {t("providers.already_working")}
              </Button>
            ) : (
              <Button
                size="sm"
                className="flex-1 gap-[4px] bg-ds-interactive hover:bg-ds-interactive-hover"
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
              className="flex-1 gap-[4px]"
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
