import { useState, useCallback, useRef, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { MapPin, Phone, List, Map, Search, Navigation, Clock, Mail, Flag, Building2, Scissors, ChevronDown } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { providersApi } from "@/api/salons";
import { professionalsApi } from "@/api/masters";
import { servicesApi } from "@/api/services";
import { NationalitySelect } from "@/components/ui/NationalitySelect";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { cn } from "@/utils/cn";
import { t } from "@/i18n";
import type { Provider, Professional } from "@/types";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";
const DEFAULT_CENTER = { lat: 51.5074, lng: -0.1278 }; // London, UK
const DEFAULT_ZOOM = 12;

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

// Custom pink nail-pin SVG marker
const NAIL_PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
  <path d="M15 1C8.93 1 4 5.93 4 12c0 8.78 11 26.5 11 26.5S26 20.78 26 12C26 5.93 21.07 1 15 1z" fill="#db2777" stroke="white" stroke-width="1.5"/>
  <circle cx="15" cy="12" r="5.5" fill="white"/>
  <text x="15" y="16" text-anchor="middle" font-size="8" fill="#db2777" font-family="serif">💅</text>
</svg>`;

const NAIL_PIN_URL = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(NAIL_PIN_SVG)}`;

// Purple person-pin for professionals on the map
const PRO_PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
  <path d="M15 1C8.93 1 4 5.93 4 12c0 8.78 11 26.5 11 26.5S26 20.78 26 12C26 5.93 21.07 1 15 1z" fill="#7c3aed" stroke="white" stroke-width="1.5"/>
  <circle cx="15" cy="12" r="5.5" fill="white"/>
  <text x="15" y="16" text-anchor="middle" font-size="9" fill="#7c3aed" font-family="serif">✂</text>
</svg>`;
const PRO_PIN_URL = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(PRO_PIN_SVG)}`;

export function SalonSelectorPage() {
  const navigate = useNavigate();
  const [chipsExpanded, setChipsExpanded] = useState(false);
  const { data: serviceNames = [] } = useQuery({
    queryKey: ["services", "names"],
    queryFn: () => servicesApi.listNames(),
    staleTime: 5 * 60 * 1000,
  });

  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [selectedProfessional, setSelectedProfessional] = useState<Professional | null>(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [view, setView] = useState<"split" | "map" | "list">("split");
  const [locationLoading, setLocationLoading] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  // Geocoded coords for providers without lat/lng
  const [geocodedCoords, setGeocodedCoords] = useState<Record<number, { lat: number; lng: number }>>({});
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const geocodedIdsRef = useRef<Set<number>>(new Set());
  const mapRef = useRef<google.maps.Map | null>(null);
  const autoFocusedRef = useRef(false);

  const [searchParams, setSearchParams] = useSearchParams();

  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["providers", "search", searchParams.get("q") ?? "", searchParams.get("type") ?? ""],
    queryFn: () => providersApi.search({
      q: searchParams.get("q") || undefined,
      service_name: searchParams.get("type") || undefined,
      limit: 100,
    }),
    staleTime: 30 * 1000,
  });

  // ── Autocomplete ──────────────────────────────────────────────────────────────
  const [acQuery, setAcQuery] = useState(() => searchParams.get("q") ?? "");
  const [acDropdown, setAcDropdown] = useState<{ providers: Provider[]; professionals: Professional[] }>({ providers: [], professionals: [] });
  const [acOpen, setAcOpen] = useState(false);
  const acContainerRef = useRef<HTMLDivElement>(null);

  const setParam = (key: string, val: string) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (val) next.set(key, val);
        else next.delete(key);
        return next;
      },
      { replace: true }
    );
  };

  const toggleType = (t: string) => {
    setParam("type", activeType === t ? "" : t);
  };

  const clearAllFilters = () => {
    setSearchParams(new URLSearchParams(), { replace: true });
    setAcQuery("");
    setAcDropdown({ providers: [], professionals: [] });
    setAcOpen(false);
  };

  const search = searchParams.get("q") ?? "";
  const nationality = searchParams.get("nationality") ?? "";
  const minExp = searchParams.get("min_exp") ?? "";
  const activeType = searchParams.get("type") ?? "";

  const { data: professionals = [], isLoading: professionalsLoading } = useQuery({
    queryKey: ["professionals", "discover", { nationality, minExp, search: search || (searchParams.get("professional_name") ?? "") }],
    queryFn: () =>
      professionalsApi.discover({
        nationality: nationality || undefined,
        min_experience: minExp ? Number(minExp) : undefined,
        search: search || searchParams.get("professional_name") || undefined,
        limit: 24,
      }),
    enabled: !!(nationality || minExp || search || searchParams.get("professional_name")),
  });

  // ── Geocoding ────────────────────────────────────────────────────────────────

  const geocodeProviders = useCallback((providerList: Provider[]) => {
    if (!geocoderRef.current) return;
    providerList.forEach((p) => {
      if (geocodedIdsRef.current.has(p.id)) return;
      if (p.latitude != null && p.longitude != null) return;
      if (!p.address) return;
      geocodedIdsRef.current.add(p.id);
      geocoderRef.current!.geocode(
        { address: p.address, region: "gb", componentRestrictions: { country: "gb" } },
        (results, status) => {
        if (status !== "OK" || !results?.[0]) {
          // Retry without country restriction in case address is not in GB
          geocoderRef.current!.geocode({ address: p.address }, (r2, s2) => {
            if (s2 === "OK" && r2?.[0]) {
              const loc2 = r2[0].geometry.location;
              setGeocodedCoords((prev) => ({ ...prev, [p.id]: { lat: loc2.lat(), lng: loc2.lng() } }));
            }
          });
          return;
        }
        const loc = results[0].geometry.location;
        setGeocodedCoords((prev) => ({
          ...prev,
          [p.id]: { lat: loc.lat(), lng: loc.lng() },
        }));
      });
    });
  }, []);

  useEffect(() => {
    if (geocoderRef.current && providers.length > 0) {
      geocodeProviders(providers);
    }
  }, [providers, geocodeProviders]);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const getCoords = (p: Provider): { lat: number; lng: number } | null => {
    if (p.latitude != null && p.longitude != null) return { lat: p.latitude, lng: p.longitude };
    return geocodedCoords[p.id] ?? null;
  };

  // ── Geolocation: ask immediately on mount ────────────────────────────────────

  useEffect(() => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationLoading(false);
      },
      () => setLocationLoading(false),
      { timeout: 10000 }
    );
  }, []);

  // ── Auto-focus: once we have user location + any provider coords ─────────────

  useEffect(() => {
    if (autoFocusedRef.current) return;
    if (!userLocation) return;
    const withCoords = providers
      .map((p) => ({ p, coords: getCoords(p) }))
      .filter((x): x is { p: Provider; coords: { lat: number; lng: number } } => x.coords !== null);
    if (withCoords.length === 0) return;
    autoFocusedRef.current = true;
    const closest = withCoords.reduce((best, curr) =>
      distanceKm(userLocation, curr.coords) < distanceKm(userLocation, best.coords) ? curr : best
    );
    setSelectedProvider(closest.p);
    setMapCenter(closest.coords);
    setMapZoom(15);
    mapRef.current?.panTo(closest.coords);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLocation, geocodedCoords, providers]);

  // ── Map events ───────────────────────────────────────────────────────────────

  // Manual "Search Nearby" — refresh location and re-focus closest salon
  const requestLocation = () => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setMapCenter(loc);
        setMapZoom(13);
        mapRef.current?.panTo(loc);
        // Find closest after manual search
        const withCoords = providers
          .map((p) => ({ p, coords: getCoords(p) }))
          .filter((x): x is { p: Provider; coords: { lat: number; lng: number } } => x.coords !== null);
        if (withCoords.length > 0) {
          const closest = withCoords.reduce((best, curr) =>
            distanceKm(loc, curr.coords) < distanceKm(loc, best.coords) ? curr : best
          );
          setSelectedProvider(closest.p);
          setMapCenter(closest.coords);
          setMapZoom(15);
          mapRef.current?.panTo(closest.coords);
        }
        setLocationLoading(false);
      },
      () => setLocationLoading(false),
      { timeout: 8000 }
    );
  };

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    geocoderRef.current = new google.maps.Geocoder();
    setMapsLoaded(true);
    if (providers.length > 0) geocodeProviders(providers);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const professionalName = searchParams.get("professional_name") ?? "";

  const handleSearch = () => {
    requestLocation();
  };

  // Click outside → close autocomplete dropdown
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (acContainerRef.current && !acContainerRef.current.contains(e.target as Node)) {
        setAcOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Build autocomplete suggestions
  useEffect(() => {
    const q = acQuery.trim();
    if (q.length < 2) {
      setAcDropdown({ providers: [], professionals: [] });
      setAcOpen(false);
      return;
    }
    const ql = q.toLowerCase();
    const matchedProviders = providers
      .filter((p) => p.name.toLowerCase().includes(ql) || (p.address ?? "").toLowerCase().includes(ql))
      .slice(0, 5);
    setAcDropdown((prev) => ({ ...prev, providers: matchedProviders }));
    if (matchedProviders.length > 0) setAcOpen(true);
    const timer = setTimeout(async () => {
      try {
        const profs = await professionalsApi.discover({ search: q, limit: 5 });
        setAcDropdown((prev) => ({ ...prev, professionals: profs }));
        if (profs.length > 0) setAcOpen(true);
      } catch { /* ignore */ }
    }, 300);
    return () => clearTimeout(timer);
  }, [acQuery, providers]);

  const handleCardClick = (provider: Provider) => {
    setSelectedProvider(provider);
    const coords = getCoords(provider);
    if (coords) {
      setMapCenter(coords);
      setMapZoom(15);
      mapRef.current?.panTo(coords);
      if (view === "list") setView("split");
    }
  };

  const referencePoint = userLocation ?? DEFAULT_CENTER;

  const filteredProviders = providers
    .filter((s) => {
      const q = search.toLowerCase();
      return (
        !q ||
        s.name.toLowerCase().includes(q) ||
        (s.address ?? "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => {
      const ca = getCoords(a);
      const cb = getCoords(b);
      if (!ca && !cb) return 0;
      if (!ca) return 1;
      if (!cb) return -1;
      return distanceKm(referencePoint, ca) - distanceKm(referencePoint, cb);
    });

  // Providers that can be shown on the map (real coords OR geocoded)
  const providersOnMap = filteredProviders
    .map((p) => ({ provider: p, coords: getCoords(p) }))
    .filter((x): x is { provider: Provider; coords: { lat: number; lng: number } } => x.coords !== null);

  // Unified list: providers first (distance-sorted), then professionals appended
  type ListItem =
    | { kind: "provider"; data: Provider }
    | { kind: "professional"; data: Professional };

  const unifiedList: ListItem[] = [
    ...filteredProviders.map((p): ListItem => ({ kind: "provider", data: p })),
    ...professionals.map((p): ListItem => ({ kind: "professional", data: p })),
  ];

  const showMap = view !== "list";
  const showList = view !== "map";

  // Coords for the selected provider's InfoWindow
  const selectedCoords = selectedProvider ? getCoords(selectedProvider) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950 flex flex-col overflow-x-hidden">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 text-center">
        <div className="flex justify-end px-2 mb-2">
          <LanguageSwitcher />
        </div>
        <div className="text-4xl mb-2">✨</div>
        <h1 className="text-3xl font-bold text-gray-800">{t("providers.title")}</h1>
        <p className="text-gray-700 mt-1">{t("providers.subtitle")}</p>
      </div>

      {/* Controls */}
      <div className="px-4 pb-3 flex flex-col gap-2 max-w-6xl mx-auto w-full">

        {/* Row 1: Unified autocomplete search + Search button + View toggles */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div ref={acContainerRef} className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none z-10" />
            <Input
              placeholder="Search salons, professionals or address…"
              value={acQuery}
              onChange={(e) => {
                const val = e.target.value;
                setAcQuery(val);
                setParam("q", val);
                setParam("professional_name", "");
              }}
              onFocus={() => { if (acQuery.trim().length >= 2) setAcOpen(true); }}
              onKeyDown={(e) => {
                if (e.key === "Escape") setAcOpen(false);
                if (e.key === "Enter") { handleSearch(); setAcOpen(false); }
              }}
              className="pl-9 bg-white"
            />
            {acOpen && (acDropdown.providers.length > 0 || acDropdown.professionals.length > 0) && (
              <div className="absolute z-50 top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-72 overflow-y-auto">
                {acDropdown.providers.length > 0 && (
                  <>
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b">
                      Providers
                    </div>
                    {acDropdown.providers.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full px-3 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-b-0"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleCardClick(p);
                          setAcQuery(p.name);
                          setParam("q", p.name);
                          setAcOpen(false);
                        }}
                      >
                        <Building2 className="h-4 w-4 text-pink-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                          {p.address && <p className="text-xs text-gray-500 truncate">{p.address}</p>}
                        </div>
                        <span className="ml-auto text-xs text-pink-600 font-medium shrink-0">Provider</span>
                      </button>
                    ))}
                  </>
                )}
                {acDropdown.professionals.length > 0 && (
                  <>
                    <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wide bg-gray-50 border-b border-t">
                      Professionals
                    </div>
                    {acDropdown.professionals.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        className="w-full px-3 py-2.5 text-left hover:bg-gray-50 flex items-center gap-3 last:border-b-0"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          navigate(`/book?professional_id=${p.id}`);
                        }}
                      >
                        <Scissors className="h-4 w-4 text-purple-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                          <p className="text-xs text-gray-500 truncate">
                            {[p.nationality, p.experience_years != null && `${p.experience_years}y exp`].filter(Boolean).join(" · ")}
                          </p>
                        </div>
                        <span className="ml-auto text-xs text-purple-600 font-medium shrink-0">Professional</span>
                      </button>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>
          <Button
            className="bg-gray-900 hover:bg-gray-950 shrink-0"
            onClick={handleSearch}
            disabled={locationLoading}
          >
            {locationLoading ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <Navigation className="mr-2 h-4 w-4" />
            )}
            {t("providers.search_nearby")}
          </Button>
          <div className="flex gap-1">
            {(["split", "map", "list"] as const).map((v) => (
              <Button
                key={v}
                variant={view === v ? "default" : "outline"}
                size="sm"
                className={view !== v ? "bg-white" : ""}
                onClick={() => setView(v)}
              >
                {v === "split" ? "Split" : v === "map" ? <Map className="h-4 w-4" /> : <List className="h-4 w-4" />}
              </Button>
            ))}
          </div>
        </div>

        {/* Row 2: Service type chips — from DB */}
        {serviceNames.length > 0 && (
          <div className="space-y-1.5">
            <div className="flex flex-wrap gap-1.5">
              {(chipsExpanded ? serviceNames : serviceNames.slice(0, 12)).map((t) => (
                <button
                  key={t}
                  onClick={() => toggleType(t)}
                  className={cn(
                    "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                    activeType === t
                      ? "bg-gray-900 border-gray-700 text-white"
                      : "bg-white border-gray-200 text-gray-700 hover:border-gray-400 hover:text-gray-700"
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
            {serviceNames.length > 12 && (
              <button
                onClick={() => setChipsExpanded((v) => !v)}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <ChevronDown className={cn("h-3 w-3 transition-transform", chipsExpanded && "rotate-180")} />
                {chipsExpanded ? "Show less" : `Show all ${serviceNames.length} services`}
              </button>
            )}
          </div>
        )}

        {/* Row 3: Professional attribute filters (nationality, experience) */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <NationalitySelect
              value={nationality}
              onChange={(val) => setParam("nationality", val)}
              placeholder={t("providers.nationality")}
              className="bg-white"
            />
          </div>
          <div className="relative sm:w-52">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              placeholder={t("providers.min_experience")}
              value={minExp}
              onChange={(e) => setParam("min_exp", e.target.value)}
              min={0}
              className="pl-9 bg-white"
            />
          </div>
          {(search || nationality || minExp || activeType || professionalName) && (
            <Button variant="outline" className="bg-white shrink-0" onClick={clearAllFilters}>
              {t("providers.clear_all")}
            </Button>
          )}
        </div>
      </div>

      {/* Main content: Map + Provider list */}
      <div className="flex-1 px-4 pb-6 max-w-6xl mx-auto w-full">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <div className={`flex gap-4 ${view === "split" ? "flex-col lg:flex-row" : "flex-col"}`}>

            {/* Map panel — always mounted to avoid LoadScript unmount/remount crashes */}
            <div className={cn(
              "rounded-xl overflow-hidden shadow-md bg-white",
              view === "split" ? "lg:flex-1 h-80 lg:h-[calc(100vh-340px)]" : "h-[60vh]",
              !showMap && "hidden",
            )}>
                {GOOGLE_MAPS_API_KEY ? (
                  <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
                    <GoogleMap
                      mapContainerStyle={{ width: "100%", height: "100%" }}
                      center={mapCenter}
                      zoom={mapZoom}
                      onLoad={onMapLoad}
                      options={{ streetViewControl: false, fullscreenControl: false, mapTypeControl: false }}
                    >
                      {/* User location dot */}
                      {mapsLoaded && userLocation && (
                        <Marker
                          position={userLocation}
                          icon={{
                            path: google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            fillColor: "#3b82f6",
                            fillOpacity: 1,
                            strokeColor: "#fff",
                            strokeWeight: 2,
                          }}
                          title="Your location"
                        />
                      )}

                      {/* Salon markers (real coords + geocoded) */}
                      {mapsLoaded && providersOnMap.map(({ provider, coords }) => (
                        <Marker
                          key={provider.id}
                          position={coords}
                          title={provider.name}
                          icon={{
                            url: NAIL_PIN_URL,
                            scaledSize: new google.maps.Size(30, 40),
                            anchor: new google.maps.Point(15, 40),
                          }}
                          onClick={() => {
                            setSelectedProvider(provider);
                            setMapCenter(coords);
                            setMapZoom(15);
                          }}
                        />
                      ))}

                      {/* Professional markers — shown at their provider's location */}
                      {mapsLoaded && professionals.map((pro) => {
                        const provId = pro.professional_providers?.[0]?.provider_id;
                        const linkedProvider = provId ? providers.find((p) => p.id === provId) : null;
                        const coords = linkedProvider ? getCoords(linkedProvider) : null;
                        if (!coords) return null;
                        return (
                          <Marker
                            key={`pro-${pro.id}`}
                            position={coords}
                            title={pro.name}
                            icon={{
                              url: PRO_PIN_URL,
                              scaledSize: new google.maps.Size(28, 38),
                              anchor: new google.maps.Point(14, 38),
                            }}
                            onClick={() => {
                              setSelectedProfessional(pro);
                              setSelectedProvider(null);
                              setMapCenter(coords);
                              setMapZoom(15);
                            }}
                          />
                        );
                      })}

                      {/* Rich InfoWindow popup */}
                      {mapsLoaded && selectedProvider && selectedCoords && (
                        <InfoWindow
                          position={selectedCoords}
                          onCloseClick={() => setSelectedProvider(null)}
                          options={{ pixelOffset: new google.maps.Size(0, -42) }}
                        >
                          <div style={{ fontFamily: "'Segoe UI', sans-serif", minWidth: 240, maxWidth: 290 }}>
                            {/* Logo + name row */}
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                              {selectedProvider.logo_url ? (
                                <img
                                  src={selectedProvider.logo_url}
                                  alt={selectedProvider.name}
                                  style={{ width: 52, height: 52, borderRadius: 10, objectFit: "cover", border: "2px solid #fce7f3", flexShrink: 0 }}
                                />
                              ) : (
                                <div style={{
                                  width: 52, height: 52, borderRadius: 10, flexShrink: 0,
                                  background: "linear-gradient(135deg, #fbcfe8, #f9a8d4)",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  fontSize: 24, fontWeight: 700, color: "#db2777",
                                }}>
                                  {selectedProvider.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div style={{ minWidth: 0 }}>
                                <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: "#111827", lineHeight: 1.3 }}>
                                  {selectedProvider.name}
                                </p>
                                {selectedProvider.category && (
                                  <p style={{ fontSize: 11, color: "#db2777", margin: "2px 0 0", fontWeight: 500 }}>
                                    {selectedProvider.category}
                                  </p>
                                )}
                              </div>
                            </div>

                            {/* Description */}
                            {selectedProvider.description && (
                              <p style={{
                                fontSize: 11, color: "#6b7280", margin: "0 0 8px",
                                display: "-webkit-box", WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical", overflow: "hidden", lineHeight: 1.5,
                              }}>
                                {selectedProvider.description}
                              </p>
                            )}

                            {/* Address + contact */}
                            <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 8 }}>
                              {selectedProvider.address && (
                                <p style={{ fontSize: 11, color: "#6b7280", margin: 0 }}>📍 {selectedProvider.address}</p>
                              )}
                              {selectedProvider.phone && (
                                <p style={{ fontSize: 11, color: "#374151", margin: 0 }}>📞 {selectedProvider.phone}</p>
                              )}
                              {selectedProvider.email && (
                                <p style={{ fontSize: 11, color: "#374151", margin: 0 }}>✉️ {selectedProvider.email}</p>
                              )}
                            </div>

                            {/* Buttons */}
                            <div style={{ display: "flex", gap: 6 }}>
                              <a
                                href={`/providers/${selectedProvider.id}`}
                                style={{ flex: 1, textAlign: "center", background: "#f3f4f6", color: "#374151",
                                  borderRadius: 20, padding: "7px 0", fontSize: 12, fontWeight: 600, textDecoration: "none" }}
                              >
                                View Profile
                              </a>
                              <a
                                href={`/book/${selectedProvider.id}`}
                                style={{ flex: 1, textAlign: "center", background: "#db2777", color: "#fff",
                                  borderRadius: 20, padding: "7px 0", fontSize: 12, fontWeight: 600, textDecoration: "none" }}
                              >
                                {t("providers.book_now")}
                              </a>
                            </div>
                          </div>
                        </InfoWindow>
                      )}

                      {/* Professional InfoWindow */}
                      {mapsLoaded && selectedProfessional && (() => {
                        const provId = selectedProfessional.professional_providers?.[0]?.provider_id;
                        const linkedProvider = provId ? providers.find((p) => p.id === provId) : null;
                        const proCoords = linkedProvider ? getCoords(linkedProvider) : null;
                        if (!proCoords) return null;
                        return (
                          <InfoWindow
                            position={proCoords}
                            onCloseClick={() => setSelectedProfessional(null)}
                            options={{ pixelOffset: new google.maps.Size(0, -42) }}
                          >
                            <div style={{ fontFamily: "'Segoe UI', sans-serif", minWidth: 220, maxWidth: 270 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                                {selectedProfessional.avatar_url ? (
                                  <img src={selectedProfessional.avatar_url} alt={selectedProfessional.name}
                                    style={{ width: 52, height: 52, borderRadius: "50%", objectFit: "cover", border: "2px solid #ede9fe", flexShrink: 0 }} />
                                ) : (
                                  <div style={{ width: 52, height: 52, borderRadius: "50%", flexShrink: 0,
                                    background: "linear-gradient(135deg, #ddd6fe, #c4b5fd)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 22, fontWeight: 700, color: "#7c3aed" }}>
                                    {selectedProfessional.name.charAt(0).toUpperCase()}
                                  </div>
                                )}
                                <div style={{ minWidth: 0 }}>
                                  <p style={{ fontWeight: 700, fontSize: 14, margin: 0, color: "#111827" }}>{selectedProfessional.name}</p>
                                  {selectedProfessional.nationality && (
                                    <p style={{ fontSize: 11, color: "#6b7280", margin: "2px 0 0" }}>🌍 {selectedProfessional.nationality}</p>
                                  )}
                                  {selectedProfessional.experience_years != null && (
                                    <p style={{ fontSize: 11, color: "#6b7280", margin: "2px 0 0" }}>⏱ {selectedProfessional.experience_years}y exp</p>
                                  )}
                                </div>
                              </div>
                              {selectedProfessional.bio && (
                                <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 8px", lineHeight: 1.5,
                                  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                                  {selectedProfessional.bio}
                                </p>
                              )}
                              {linkedProvider && (
                                <p style={{ fontSize: 11, color: "#6b7280", margin: "0 0 8px" }}>
                                  🏪 {linkedProvider.name}
                                </p>
                              )}
                              <div style={{ display: "flex", gap: 6 }}>
                                <a href={`/professionals/${selectedProfessional.id}`}
                                  style={{ flex: 1, textAlign: "center", background: "#f3f4f6", color: "#374151",
                                    borderRadius: 20, padding: "7px 0", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                                  View Profile
                                </a>
                                <a href={`/book?professional_id=${selectedProfessional.id}`}
                                  style={{ flex: 1, textAlign: "center", background: "#7c3aed", color: "#fff",
                                    borderRadius: 20, padding: "7px 0", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
                                  Book Now
                                </a>
                              </div>
                            </div>
                          </InfoWindow>
                        );
                      })()}
                    </GoogleMap>
                  </LoadScript>
                ) : (
                  <div className="flex h-full items-center justify-center bg-gray-100 text-sm text-gray-500 p-6 text-center">
                    <div>
                      <MapPin className="h-10 w-10 mx-auto mb-2 text-gray-400" />
                      <p className="font-medium">{t("providers.map_unavailable")}</p>
                      <p className="text-xs mt-1">Set <code>VITE_GOOGLE_MAPS_API_KEY</code> in your <code>.env</code> file to enable the map.</p>
                    </div>
                  </div>
                )}
              </div>

            {/* Provider list panel */}
            {showList && (
              <div className={`space-y-3 ${view === "split" ? "lg:w-80 lg:overflow-y-auto lg:max-h-[calc(100vh-340px)]" : ""}`}>
                {unifiedList.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">{t("providers.no_providers")}</p>
                ) : (
                  unifiedList.map((item) =>
                    item.kind === "provider" ? (
                      <ProviderCard
                        key={`prov-${item.data.id}`}
                        provider={item.data}
                        isSelected={selectedProvider?.id === item.data.id}
                        hasMapPin={getCoords(item.data) !== null}
                        onClick={() => handleCardClick(item.data)}
                      />
                    ) : (
                      <ProfessionalCard
                        key={`pro-${item.data.id}`}
                        professional={item.data}
                      />
                    )
                  )
                )}
                {(professionalsLoading) && (
                  <div className="flex justify-center py-4"><Spinner /></div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function ProfessionalCard({ professional }: { professional: Professional }) {
  const coverImage = professional.avatar_url ?? professional.photos?.[0]?.image_url;
  return (
    <Card className="hover:shadow-md hover:-translate-y-0.5 transition-all bg-white">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {coverImage ? (
            <img src={coverImage} alt={professional.name}
              className="w-12 h-12 rounded-full object-cover border border-purple-100 shrink-0" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-200 to-violet-300 flex items-center justify-center text-xl font-bold text-purple-700 shrink-0">
              {professional.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1 flex-wrap">
              <h2 className="text-base font-semibold text-gray-900 truncate">{professional.name}</h2>
              <span className="inline-flex items-center gap-1 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200 rounded-full px-2 py-0.5 shrink-0">
                <Scissors className="h-3 w-3" /> Professional
              </span>
            </div>
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1 text-xs text-gray-500">
              {professional.nationality && (
                <span className="flex items-center gap-1"><Flag className="h-3 w-3 text-gray-400" />{professional.nationality}</span>
              )}
              {professional.experience_years != null && (
                <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-gray-400" />{professional.experience_years}y exp</span>
              )}
            </div>
            {professional.bio && (
              <p className="mt-1 text-xs text-gray-500 line-clamp-2">{professional.bio}</p>
            )}
          </div>
        </div>
        <div className="mt-3 flex gap-2">
          <Link to={`/professionals/${professional.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">{t("providers.view_profile")}</Button>
          </Link>
          <Link to={`/book?professional_id=${professional.id}`} className="flex-1">
            <Button size="sm" className="w-full bg-purple-700 hover:bg-purple-800">{t("providers.book_now").replace(" →", "")}</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function ProviderCard({
  provider, isSelected, hasMapPin, onClick,
}: {
  provider: Provider;
  isSelected: boolean;
  hasMapPin: boolean;
  onClick: () => void;
}) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${isSelected ? "ring-2 ring-gray-500 shadow-md" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Logo / initial */}
          {provider.logo_url ? (
            <img
              src={provider.logo_url}
              alt={provider.name}
              className="w-12 h-12 rounded-lg object-cover border border-gray-200 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-gray-300 to-gray-400 flex items-center justify-center text-xl font-bold text-white shrink-0">
              {provider.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h2 className="text-base font-semibold text-gray-900 truncate">{provider.name}</h2>
              {hasMapPin && (
                <MapPin className="h-3.5 w-3.5 text-gray-500 shrink-0" />
              )}
            </div>
            <span className="inline-flex items-center gap-1 text-xs font-medium bg-pink-50 text-pink-700 border border-pink-200 rounded-full px-2 py-0.5 mt-0.5">
              <Building2 className="h-3 w-3" /> Provider
            </span>
            {provider.description && (
              <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{provider.description}</p>
            )}
            <div className="flex flex-col gap-0.5 mt-1.5 text-xs text-gray-500">
              {provider.address && (
                <span className="flex items-center gap-1 min-w-0">
                  <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                  <span className="truncate">{provider.address}</span>
                </span>
              )}
              {provider.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-gray-400 shrink-0" />
                  {provider.phone}
                </span>
              )}
              {provider.email && (
                <span className="flex items-center gap-1 min-w-0">
                  <Mail className="h-3 w-3 text-gray-400 shrink-0" />
                  <span className="truncate">{provider.email}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3 flex gap-2">
          <Link
            to={`/providers/${provider.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-200 transition-colors"
          >
            View Profile
          </Link>
          <a
            href={`/book/${provider.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center rounded-full bg-gray-50 px-4 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200"
          >
            {t("providers.book_now")}
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
