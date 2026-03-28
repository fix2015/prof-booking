import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { usePublicProviders } from "@/hooks/useSalon";
import { AppHeader } from "@/components/mobile/AppHeader";
import { ProviderCard } from "@/components/mobile/ProviderCard";
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

type Tab = "All" | "Providers" | "Services";

export function SavedPage() {
  const navigate = useNavigate();
  const { data: providers = [] } = usePublicProviders();
  const [saved, setSaved] = useState<number[]>(getSaved);
  const [tab, setTab] = useState<Tab>("All");

  const savedProviders = useMemo(
    () => providers.filter((p) => saved.includes(p.id)),
    [providers, saved]
  );

  const AddButton = (
    <button className="w-8 h-8 flex items-center justify-center text-ds-text-primary">
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
        <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </button>
  );

  return (
    <div className="flex flex-col min-h-full bg-ds-bg-primary">
      <AppHeader variant="title-action" title={t("saved.title")} rightElement={AddButton} />

      {/* Segment tabs */}
      <div className="flex bg-ds-bg-primary border-b border-ds-border px-ds-4">
        {(["All", "Providers", "Services"] as Tab[]).map((tabItem) => (
          <button
            key={tabItem}
            onClick={() => setTab(tabItem)}
            className={`h-[44px] px-ds-3 ds-label transition-colors relative ${
              tab === tabItem ? "text-ds-text-primary" : "text-ds-text-muted"
            }`}
          >
            {tabItem === "All" ? t("saved.tab.all") : tabItem === "Providers" ? t("saved.tab.providers") : t("saved.tab.services")}
            {tab === tabItem && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-ds-interactive" />
            )}
          </button>
        ))}
      </div>

      <div className="flex-1 px-ds-4 py-[14px]">
        {savedProviders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-ds-12 gap-ds-4">
            <div className="w-[72px] h-[72px] rounded-ds-full bg-ds-bg-primary border border-ds-border flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" className="text-ds-text-disabled">
                <path
                  d="M16 27L3.5 14.5C2 13 1.5 11 1.5 9.5C1.5 6 4 3.5 7.5 3.5C9.5 3.5 11.5 4.5 13 6L16 9L19 6C20.5 4.5 22.5 3.5 24.5 3.5C28 3.5 30.5 6 30.5 9.5C30.5 11 30 13 28.5 14.5L16 27Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                />
              </svg>
            </div>
            <div className="text-center">
              <p className="ds-body-strong text-ds-text-primary">{t("saved.empty_title")}</p>
              <p className="ds-body-small text-ds-text-secondary mt-ds-1">
                {t("saved.empty_subtitle")}
              </p>
            </div>
            <button
              onClick={() => navigate("/")}
              className="px-ds-6 h-[44px] bg-ds-interactive rounded-ds-xl ds-body-strong text-ds-text-inverse"
            >
              {t("saved.browse")}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-[10px]">
            {savedProviders.map((provider) => (
              <ProviderCard
                key={provider.id}
                provider={provider}
                variant="list"
                saved={true}
                onToggleSave={(id) => setSaved(toggleSaved(id))}
                onClick={(id) => navigate(`/providers/${id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
