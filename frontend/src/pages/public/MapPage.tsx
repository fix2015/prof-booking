import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { usePublicProviders } from "@/hooks/useSalon";
import { AppHeader } from "@/components/mobile/AppHeader";
import { ProviderCard } from "@/components/mobile/ProviderCard";
import { t } from "@/i18n";
import { Provider } from "@/types";

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

const DEFAULT_CENTER = { lat: 40.7128, lng: -74.006 };
const MAP_CONTAINER = { width: "100%", height: "100%" };

export function MapPage() {
  const navigate = useNavigate();
  const { data: providers = [] } = usePublicProviders();
  const [saved, setSaved] = useState<number[]>(getSaved);
  const [selected, setSelected] = useState<Provider | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey ?? "",
    id: "google-map-script",
  });

  const handleMarkerClick = useCallback((provider: Provider) => {
    setSelected(provider);
  }, []);

  const geoProviders = providers.filter((p) => p.latitude && p.longitude);

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      {/* Floating header */}
      <AppHeader variant="brand" />

      {/* Map fills remaining space */}
      <div className="relative flex-1">
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={MAP_CONTAINER}
            center={DEFAULT_CENTER}
            zoom={12}
            options={{
              disableDefaultUI: true,
              clickableIcons: false,
              styles: [{ featureType: "poi", stylers: [{ visibility: "off" }] }],
            }}
          >
            {geoProviders.map((p) => (
              <Marker
                key={p.id}
                position={{ lat: p.latitude!, lng: p.longitude! }}
                onClick={() => handleMarkerClick(p)}
                label={{
                  text: p.worker_payment_amount > 0 ? `$${p.worker_payment_amount}` : p.name.slice(0, 3),
                  className: "map-price-label",
                }}
              />
            ))}
          </GoogleMap>
        ) : (
          <div className="w-full h-full bg-ds-bg-secondary flex items-center justify-center">
            <p className="ds-body text-ds-text-secondary">{t("map.loading")}</p>
          </div>
        )}

        {/* Bottom sheet */}
        <div className="absolute bottom-0 left-0 right-0 bg-ds-bg-primary rounded-t-ds-2xl shadow-lg">
          <div className="flex justify-center pt-ds-2 pb-ds-1">
            <div className="w-8 h-1 bg-ds-border rounded-ds-full" />
          </div>

          {selected ? (
            <div className="px-ds-4 pb-ds-4">
              <ProviderCard
                provider={selected}
                variant="compact"
                saved={saved.includes(selected.id)}
                onToggleSave={(id) => setSaved(toggleSaved(id))}
                onClick={(id) => navigate(`/providers/${id}`)}
              />
              <button
                onClick={() => navigate(`/providers/${selected.id}`)}
                className="mt-ds-3 w-full h-[44px] bg-ds-interactive rounded-ds-xl ds-body-strong text-ds-text-inverse"
              >
                {t("map.view_provider")}
              </button>
            </div>
          ) : (
            <div className="px-ds-4 pb-ds-4 max-h-[40vh] overflow-y-auto">
              <p className="ds-body-small text-ds-text-secondary mb-ds-3">
                {t("map.providers_nearby", { count: geoProviders.length })}
              </p>
              <div className="flex flex-col gap-ds-2">
                {providers.map((p) => (
                  <ProviderCard
                    key={p.id}
                    provider={p}
                    variant="compact"
                    saved={saved.includes(p.id)}
                    onToggleSave={(id) => setSaved(toggleSaved(id))}
                    onClick={(id) => navigate(`/providers/${id}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
