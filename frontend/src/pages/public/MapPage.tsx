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
  const [searchQuery, setSearchQuery] = useState("");
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

  const handleSearch = useCallback(() => {
    if (!isLoaded || !searchQuery.trim() || !mapRef.current) return;
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ address: searchQuery }, (results, status) => {
      if (status === "OK" && results?.[0]) {
        mapRef.current?.panTo(results[0].geometry.location);
        mapRef.current?.setZoom(13);
      }
    });
  }, [isLoaded, searchQuery]);

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

        {/* Search bar overlay */}
        <div className="absolute top-[12px] left-[16px] right-[16px] z-10">
          <div className="flex items-center gap-ds-2 h-[46px] bg-ds-bg-primary border border-ds-border rounded-ds-full pl-[16px] pr-[5px] py-[7px] shadow-sm">
            <div className="w-[8px] h-[8px] rounded-ds-full bg-ds-interactive flex-shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSearch(); }}
              placeholder={t("map.search_placeholder")}
              className="flex-1 ds-body text-ds-text-primary placeholder:text-ds-text-secondary bg-transparent outline-none min-w-0"
            />
            <button
              onClick={handleSearch}
              className="flex-shrink-0 h-[36px] px-[18px] bg-ds-interactive rounded-ds-full ds-label text-ds-text-inverse"
            >
              {t("map.search_btn")}
            </button>
          </div>
        </div>

        {/* Searching indicator */}
        {isFetching && bounds && (
          <div className="absolute top-[68px] left-1/2 -translate-x-1/2 bg-ds-bg-primary rounded-ds-full px-ds-4 py-[6px] shadow-md z-10">
            <p className="ds-caption text-ds-text-secondary">{t("common.loading")}</p>
          </div>
        )}

        {/* Bottom sheet */}
        <div className="absolute bottom-0 left-0 right-0 bg-ds-bg-primary rounded-t-ds-2xl shadow-lg z-10">
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
