import { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import { useSearchProviders } from "@/hooks/useSalon";
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

const DEFAULT_CENTER = { lat: 51.5074, lng: -0.1278 };
const MAP_CONTAINER = { width: "100%", height: "100%" };

interface Bounds {
  latMin: number;
  latMax: number;
  lngMin: number;
  lngMax: number;
}

export function MapPage() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState<number[]>(getSaved);
  const [selected, setSelected] = useState<Provider | null>(null);
  const [bounds, setBounds] = useState<Bounds | undefined>(undefined);
  const mapRef = useRef<google.maps.Map | null>(null);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: apiKey ?? "",
    id: "google-map-script",
  });

  const { data: providers = [], isFetching } = useSearchProviders({ bounds });

  const handleMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
  }, []);

  // Fires when map becomes idle after pan/zoom — read bounds and update state
  const handleIdle = useCallback(() => {
    const map = mapRef.current;
    if (!map) return;
    const b = map.getBounds();
    if (!b) return;
    const sw = b.getSouthWest();
    const ne = b.getNorthEast();
    setBounds({
      latMin: sw.lat(),
      latMax: ne.lat(),
      lngMin: sw.lng(),
      lngMax: ne.lng(),
    });
  }, []);

  const handleMarkerClick = useCallback((provider: Provider) => {
    setSelected(provider);
  }, []);

  const geoProviders = providers.filter((p) => p.latitude && p.longitude);

  return (
    <div className="flex flex-col h-[calc(100vh-56px)]">
      <AppHeader variant="brand" />

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
            onLoad={handleMapLoad}
            onIdle={handleIdle}
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

        {/* Searching indicator */}
        {isFetching && bounds && (
          <div className="absolute top-ds-3 left-1/2 -translate-x-1/2 bg-ds-bg-primary rounded-ds-full px-ds-4 py-[6px] shadow-md">
            <p className="ds-caption text-ds-text-secondary">{t("common.loading")}</p>
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
