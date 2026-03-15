import { useState, useCallback, useRef, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { MapPin, Phone, List, Map, Search, Navigation, Clock, Mail, Flag } from "lucide-react";
import { usePublicProviders } from "@/hooks/useSalon";
import { useQuery } from "@tanstack/react-query";
import { professionalsApi } from "@/api/masters";
import { NationalitySelect } from "@/components/ui/NationalitySelect";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import type { Provider, Professional } from "@/types";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";
const DEFAULT_CENTER = { lat: 48.8566, lng: 2.3522 };
const DEFAULT_ZOOM = 12;

const SERVICE_TYPES = [
  "Manicure", "Pedicure", "Gel Nails", "Acrylic",
  "Nail Art", "Extensions", "Shellac", "Spa",
];

// Custom pink nail-pin SVG marker
const NAIL_PIN_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="40" viewBox="0 0 30 40">
  <path d="M15 1C8.93 1 4 5.93 4 12c0 8.78 11 26.5 11 26.5S26 20.78 26 12C26 5.93 21.07 1 15 1z" fill="#db2777" stroke="white" stroke-width="1.5"/>
  <circle cx="15" cy="12" r="5.5" fill="white"/>
  <text x="15" y="16" text-anchor="middle" font-size="8" fill="#db2777" font-family="serif">💅</text>
</svg>`;

const NAIL_PIN_URL = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(NAIL_PIN_SVG)}`;

export function SalonSelectorPage() {
  const { data: providers = [], isLoading } = usePublicProviders();

  const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [view, setView] = useState<"split" | "map" | "list">("split");
  const [locationLoading, setLocationLoading] = useState(false);

  // Geocoded coords for providers without lat/lng
  const [geocodedCoords, setGeocodedCoords] = useState<Record<number, { lat: number; lng: number }>>({});
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const geocodedIdsRef = useRef<Set<number>>(new Set());
  const mapRef = useRef<google.maps.Map | null>(null);

  const [searchParams, setSearchParams] = useSearchParams();

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
  };

  const search = searchParams.get("q") ?? "";
  const nationality = searchParams.get("nationality") ?? "";
  const minExp = searchParams.get("min_exp") ?? "";
  const activeType = searchParams.get("type") ?? "";

  const [committed, setCommitted] = useState<{
    nationality: string; minExp: string; type: string;
  } | null>(null);

  const { data: professionals = [], isLoading: professionalsLoading } = useQuery({
    queryKey: ["professionals", "discover", committed],
    queryFn: () =>
      professionalsApi.discover({
        nationality: committed?.nationality || undefined,
        min_experience: committed?.minExp ? Number(committed.minExp) : undefined,
        search: committed?.type || undefined,
        limit: 24,
      }),
    enabled: !!(committed && (committed.nationality || committed.minExp || committed.type)),
  });

  // ── Geocoding ────────────────────────────────────────────────────────────────

  const geocodeProviders = useCallback((providerList: Provider[]) => {
    if (!geocoderRef.current) return;
    providerList.forEach((p) => {
      if (geocodedIdsRef.current.has(p.id)) return;
      if (p.latitude != null && p.longitude != null) return;
      if (!p.address) return;
      geocodedIdsRef.current.add(p.id);
      geocoderRef.current!.geocode({ address: p.address }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          const loc = results[0].geometry.location;
          setGeocodedCoords((prev) => ({
            ...prev,
            [p.id]: { lat: loc.lat(), lng: loc.lng() },
          }));
        }
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

  // ── Map events ───────────────────────────────────────────────────────────────

  const requestLocation = (map?: google.maps.Map) => {
    if (!navigator.geolocation) return;
    setLocationLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(loc);
        setMapCenter(loc);
        setMapZoom(13);
        (map ?? mapRef.current)?.panTo(loc);
        setLocationLoading(false);
      },
      () => setLocationLoading(false),
      { timeout: 8000 }
    );
  };

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    geocoderRef.current = new google.maps.Geocoder();
    requestLocation(map);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hasProfessionalFilter = !!committed;

  const handleSearch = () => {
    requestLocation();
    setCommitted({ nationality, minExp, type: activeType });
  };

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

  const filteredProviders = providers.filter((s) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      s.name.toLowerCase().includes(q) ||
      (s.address ?? "").toLowerCase().includes(q);
    const matchType =
      !activeType ||
      s.name.toLowerCase().includes(activeType.toLowerCase()) ||
      (s.description ?? "").toLowerCase().includes(activeType.toLowerCase());
    return matchSearch && matchType;
  });

  // Providers that can be shown on the map (real coords OR geocoded)
  const providersOnMap = filteredProviders
    .map((p) => ({ provider: p, coords: getCoords(p) }))
    .filter((x): x is { provider: Provider; coords: { lat: number; lng: number } } => x.coords !== null);

  const showMap = view !== "list";
  const showList = view !== "map";

  // Coords for the selected provider's InfoWindow
  const selectedCoords = selectedProvider ? getCoords(selectedProvider) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 text-center">
        <div className="text-4xl mb-2">✨</div>
        <h1 className="text-3xl font-bold text-pink-800">Find Your Provider</h1>
        <p className="text-pink-600 mt-1">Discover service providers near you</p>
      </div>

      {/* Controls */}
      <div className="px-4 pb-3 flex flex-col gap-2 max-w-6xl mx-auto w-full">

        {/* Row 1: Provider text search + Search button + View toggles */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name or address…"
              value={search}
              onChange={(e) => setParam("q", e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="pl-9 bg-white"
            />
          </div>
          <Button
            className="bg-pink-600 hover:bg-pink-700 shrink-0"
            onClick={handleSearch}
            disabled={locationLoading}
          >
            {locationLoading ? (
              <Spinner size="sm" className="mr-2" />
            ) : (
              <Navigation className="mr-2 h-4 w-4" />
            )}
            Search Nearby
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

        {/* Row 2: Service type chips */}
        <div className="flex flex-wrap gap-1.5">
          {SERVICE_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => toggleType(t)}
              className={cn(
                "px-3 py-1 rounded-full text-xs font-medium border transition-colors",
                activeType === t
                  ? "bg-pink-600 border-pink-600 text-white"
                  : "bg-white border-gray-200 text-gray-700 hover:border-pink-400 hover:text-pink-700"
              )}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Row 3: Professional filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <NationalitySelect
              value={nationality}
              onChange={(val) => setParam("nationality", val)}
              placeholder="Professional nationality…"
              className="bg-white"
            />
          </div>
          <div className="relative sm:w-52">
            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="number"
              placeholder="Min years experience"
              value={minExp}
              onChange={(e) => setParam("min_exp", e.target.value)}
              min={0}
              className="pl-9 bg-white"
            />
          </div>
          {(search || nationality || minExp || activeType) && (
            <Button variant="outline" className="bg-white shrink-0" onClick={clearAllFilters}>
              Clear all
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

            {/* Map panel */}
            {showMap && (
              <div className={`rounded-xl overflow-hidden shadow-md bg-white ${view === "split" ? "lg:flex-1 h-80 lg:h-[calc(100vh-340px)]" : "h-[60vh]"}`}>
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
                      {userLocation && (
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
                      {providersOnMap.map(({ provider, coords }) => (
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

                      {/* Rich InfoWindow popup */}
                      {selectedProvider && selectedCoords && (
                        <InfoWindow
                          position={selectedCoords}
                          onCloseClick={() => setSelectedProvider(null)}
                          options={{ pixelOffset: new google.maps.Size(0, -42) }}
                        >
                          <div style={{ fontFamily: "'Segoe UI', sans-serif", minWidth: 220, maxWidth: 270 }}>
                            {/* Logo + name row */}
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
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
                                {selectedProvider.address && (
                                  <p style={{ fontSize: 11, color: "#6b7280", margin: "3px 0 0", lineHeight: 1.4 }}>
                                    📍 {selectedProvider.address}
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

                            {/* Contact */}
                            {(selectedProvider.phone || selectedProvider.email) && (
                              <div style={{ display: "flex", flexDirection: "column", gap: 3, marginBottom: 10 }}>
                                {selectedProvider.phone && (
                                  <p style={{ fontSize: 12, color: "#374151", margin: 0 }}>
                                    📞 {selectedProvider.phone}
                                  </p>
                                )}
                                {selectedProvider.email && (
                                  <p style={{ fontSize: 12, color: "#374151", margin: 0 }}>
                                    ✉️ {selectedProvider.email}
                                  </p>
                                )}
                              </div>
                            )}

                            {/* Book button */}
                            <a
                              href={`/book/${selectedProvider.id}`}
                              style={{
                                display: "block", textAlign: "center",
                                background: "#db2777", color: "#fff",
                                borderRadius: 20, padding: "7px 0",
                                fontSize: 13, fontWeight: 600,
                                textDecoration: "none", letterSpacing: "0.01em",
                              }}
                            >
                              Book Now →
                            </a>
                          </div>
                        </InfoWindow>
                      )}
                    </GoogleMap>
                  </LoadScript>
                ) : (
                  <div className="flex h-full items-center justify-center bg-gray-100 text-sm text-gray-500 p-6 text-center">
                    <div>
                      <MapPin className="h-10 w-10 mx-auto mb-2 text-pink-400" />
                      <p className="font-medium">Map unavailable</p>
                      <p className="text-xs mt-1">Set <code>VITE_GOOGLE_MAPS_API_KEY</code> in your <code>.env</code> file to enable the map.</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Provider list panel */}
            {showList && (
              <div className={`space-y-3 ${view === "split" ? "lg:w-80 lg:overflow-y-auto lg:max-h-[calc(100vh-340px)]" : ""}`}>
                {filteredProviders.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No providers found</p>
                ) : (
                  filteredProviders.map((provider) => (
                    <ProviderCard
                      key={provider.id}
                      provider={provider}
                      isSelected={selectedProvider?.id === provider.id}
                      hasMapPin={getCoords(provider) !== null}
                      onClick={() => handleCardClick(provider)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Professionals results */}
      {hasProfessionalFilter && (
        <div className="px-4 pb-8 max-w-6xl mx-auto w-full">
          <h2 className="text-xl font-bold text-pink-800 mb-3">Professionals</h2>
          {professionalsLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : professionals.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {professionals.map((professional) => (
                <ProfessionalCard key={professional.id} professional={professional} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No professionals found matching your filters</p>
          )}
        </div>
      )}
    </div>
  );
}

function ProfessionalCard({ professional }: { professional: Professional }) {
  const coverImage = professional.avatar_url ?? professional.photos?.[0]?.image_url;
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group bg-white">
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
              <Flag className="h-3 w-3" />{professional.nationality}
            </span>
          )}
          {professional.experience_years != null && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />{professional.experience_years}y exp
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
      className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${isSelected ? "ring-2 ring-pink-500 shadow-md" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          {/* Logo / initial */}
          {provider.logo_url ? (
            <img
              src={provider.logo_url}
              alt={provider.name}
              className="w-12 h-12 rounded-lg object-cover border border-pink-100 shrink-0"
            />
          ) : (
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-pink-200 to-rose-300 flex items-center justify-center text-xl font-bold text-white shrink-0">
              {provider.name.charAt(0).toUpperCase()}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1">
              <h2 className="text-base font-semibold text-gray-900 truncate">{provider.name}</h2>
              {hasMapPin && (
                <MapPin className="h-3.5 w-3.5 text-pink-500 shrink-0" />
              )}
            </div>
            {provider.description && (
              <p className="text-gray-500 text-xs mt-0.5 line-clamp-2">{provider.description}</p>
            )}
            <div className="flex flex-col gap-0.5 mt-1.5 text-xs text-gray-500">
              {provider.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-pink-400 shrink-0" />
                  <span className="truncate">{provider.address}</span>
                </span>
              )}
              {provider.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-pink-400 shrink-0" />
                  {provider.phone}
                </span>
              )}
              {provider.email && (
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3 text-pink-400 shrink-0" />
                  <span className="truncate">{provider.email}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="mt-3">
          <a
            href={`/book/${provider.id}`}
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center rounded-full bg-pink-50 px-4 py-1.5 text-xs font-medium text-pink-700 hover:bg-pink-100 transition-colors"
          >
            Book Now →
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
