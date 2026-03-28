import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { usePublicProvider } from "@/hooks/useSalon";
import { useProviderProfessionalsPublic } from "@/hooks/useMaster";
import { servicesApi } from "@/api/services";
import { AppHeader } from "@/components/mobile/AppHeader";
import { MobileAvatar } from "@/components/mobile/MobileAvatar";
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

export function ProviderProfilePage() {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  const id = Number(providerId);

  const { data: provider, isLoading } = usePublicProvider(id);
  const { data: professionals = [] } = useProviderProfessionalsPublic(id);
  const { data: services = [] } = useQuery({
    queryKey: ["services", "provider", id],
    queryFn: () => servicesApi.listByProvider(id),
    enabled: !!id,
  });

  const [saved, setSaved] = useState<number[]>(getSaved);
  const [showAllServices, setShowAllServices] = useState(false);

  const isSaved = provider ? saved.includes(provider.id) : false;

  const HeartButton = (
    <button
      onClick={() => provider && setSaved(toggleSaved(provider.id))}
      className="w-8 h-8 flex items-center justify-center"
      aria-label={isSaved ? "Unsave" : "Save"}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill={isSaved ? "var(--ds-feedback-saved)" : "none"}>
        <path
          d="M10 17.5L2 9.5C1 8.5 0.5 7 0.5 6C0.5 3.5 2.5 1.5 5 1.5C6.5 1.5 7.8 2.2 9 3.5L10 4.5L11 3.5C12.2 2.2 13.5 1.5 15 1.5C17.5 1.5 19.5 3.5 19.5 6C19.5 7 19 8.5 18 9.5L10 17.5Z"
          stroke={isSaved ? "var(--ds-feedback-saved)" : "var(--ds-border-strong)"}
          strokeWidth="1.5"
        />
      </svg>
    </button>
  );

  if (isLoading) {
    return (
      <div className="max-w-[390px] mx-auto min-h-screen bg-ds-bg-secondary flex flex-col">
        <AppHeader variant="back-title" title={t("providers.loading")} />
        <div className="h-[140px] bg-ds-bg-secondary animate-pulse" />
        <div className="p-ds-4 flex flex-col gap-ds-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-12 bg-ds-bg-secondary rounded-ds-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="max-w-[390px] mx-auto flex flex-col items-center justify-center min-h-[300px] gap-ds-3 p-ds-6">
        <p className="ds-body text-ds-text-secondary">{t("providers.not_found")}</p>
        <button onClick={() => navigate("/")} className="ds-body-small text-ds-interactive">
          {t("providers.back_to_discovery")}
        </button>
      </div>
    );
  }

  const displayedServices = showAllServices ? services : services.slice(0, 4);

  return (
    <div className="max-w-[390px] mx-auto min-h-screen flex flex-col bg-ds-bg-secondary">
      <AppHeader variant="back-title-action" title={provider.name} rightElement={HeartButton} />

      {/* Hero banner */}
      <div className="h-[140px] bg-ds-avatar-teal flex items-center justify-center relative overflow-hidden">
        {provider.logo_url ? (
          <img src={provider.logo_url} alt={provider.name} className="w-full h-full object-cover" />
        ) : null}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-ds-2">
          <MobileAvatar name={provider.name} size="xl" color="teal" imageUrl={provider.logo_url ?? undefined} />
        </div>
      </div>

      {/* Provider info */}
      <div className="bg-ds-bg-primary px-ds-4 pt-ds-4 pb-ds-4 flex flex-col items-center gap-ds-2 border-b border-ds-border">
        <h1 className="ds-h1 text-ds-text-primary text-center">{provider.name}</h1>
        {provider.category && (
          <span className="bg-ds-bg-secondary rounded-ds-full px-ds-3 py-[2px] ds-caption text-ds-text-secondary">
            {provider.category}
          </span>
        )}
        {provider.address && (
          <p className="ds-body-small text-ds-text-secondary text-center">{provider.address}</p>
        )}

        {/* Stats */}
        <div className="flex gap-ds-6 mt-ds-2">
          <div className="text-center">
            <p className="ds-h2 text-ds-text-primary">{services.length}</p>
            <p className="ds-caption text-ds-text-secondary">{t("providers.services_label")}</p>
          </div>
          <div className="w-px bg-ds-border" />
          <div className="text-center">
            <p className="ds-h2 text-ds-text-primary">{professionals.length}</p>
            <p className="ds-caption text-ds-text-secondary">{t("providers.professionals_label")}</p>
          </div>
        </div>
      </div>

      {/* Book CTA */}
      <div className="px-ds-4 py-ds-4 bg-ds-bg-primary border-b border-ds-border">
        <button
          onClick={() => navigate(`/book/${provider.id}`)}
          className="w-full h-[48px] bg-ds-interactive rounded-ds-2xl ds-body-large text-ds-text-inverse"
        >
          {t("providers.book_appointment")}
        </button>
      </div>

      {/* Services */}
      {services.length > 0 && (
        <div className="bg-ds-bg-primary mt-ds-3 border-t border-ds-border">
          <div className="px-ds-4 pt-ds-4 pb-ds-2">
            <p className="ds-h4 text-ds-text-primary">{t("providers.services_section")}</p>
          </div>
          <div>
            {displayedServices.map((service, idx) => (
              <div
                key={service.id}
                className={`flex items-center px-ds-4 py-ds-3 ${
                  idx < displayedServices.length - 1 ? "border-b border-ds-border" : ""
                }`}
              >
                <div className="flex-1">
                  <p className="ds-body text-ds-text-primary">{service.name}</p>
                  <p className="ds-caption text-ds-text-secondary">{t("providers.duration_min", { min: service.duration_minutes })}</p>
                </div>
                <p className="ds-body-strong text-ds-text-primary">${service.price}</p>
              </div>
            ))}
          </div>
          {services.length > 4 && (
            <button
              onClick={() => setShowAllServices((v) => !v)}
              className="w-full py-ds-3 ds-body-small text-ds-interactive border-t border-ds-border"
            >
              {showAllServices ? t("providers.show_less") : t("providers.show_all", { count: services.length })}
            </button>
          )}
        </div>
      )}

      {/* Professionals */}
      {professionals.length > 0 && (
        <div className="bg-ds-bg-primary mt-ds-3 border-t border-ds-border pb-ds-4">
          <div className="px-ds-4 pt-ds-4 pb-ds-3">
            <p className="ds-h4 text-ds-text-primary">{t("providers.our_team")}</p>
          </div>
          <div className="flex gap-ds-4 px-ds-4 overflow-x-auto scrollbar-none">
            {professionals.map((pro) => (
              <button
                key={pro.id}
                onClick={() => navigate(`/professionals/${pro.id}`)}
                className="flex flex-col items-center gap-ds-2 flex-shrink-0 w-[72px]"
              >
                <MobileAvatar name={pro.name} size="lg" imageUrl={pro.avatar_url ?? undefined} />
                <p className="ds-body-strong text-ds-text-primary text-center leading-tight">{pro.name}</p>
                {pro.experience_years && (
                  <p className="ds-caption text-ds-text-secondary">{pro.experience_years}y exp</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
