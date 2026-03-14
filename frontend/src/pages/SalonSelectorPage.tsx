import { useState, useCallback, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { GoogleMap, LoadScript, Marker, InfoWindow } from "@react-google-maps/api";
import { MapPin, Phone, List, Map, Search, Navigation, Flag, Clock, Star } from "lucide-react";
import { usePublicSalons } from "@/hooks/useSalon";
import { useQuery } from "@tanstack/react-query";
import { mastersApi } from "@/api/masters";
import { Spinner } from "@/components/ui/spinner";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import type { Salon, Master } from "@/types";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";
const DEFAULT_CENTER = { lat: 48.8566, lng: 2.3522 };
const DEFAULT_ZOOM = 12;

const SERVICE_TYPES = [
  "Manicure", "Pedicure", "Gel Nails", "Acrylic",
  "Nail Art", "Extensions", "Shellac", "Spa",
];

export function SalonSelectorPage() {
  const { data: salons = [], isLoading } = usePublicSalons();
  const [selectedSalon, setSelectedSalon] = useState<Salon | null>(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState(DEFAULT_ZOOM);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [view, setView] = useState<"split" | "map" | "list">("split");
  const [locationLoading, setLocationLoading] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);

  // ── URL-driven filters ──────────────────────────────
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

  // ── Committed filter state (only updates on Search button click) ──
  const [committed, setCommitted] = useState<{
    nationality: string; minExp: string; type: string;
  } | null>(null);

  // ── Master discovery ────────────────────────────────
  const { data: masters = [], isLoading: mastersLoading } = useQuery({
    queryKey: ["masters", "discover", committed],
    queryFn: () =>
      mastersApi.discover({
        nationality: committed?.nationality || undefined,
        min_experience: committed?.minExp ? Number(committed.minExp) : undefined,
        search: committed?.type || undefined,
        limit: 24,
      }),
    enabled: !!(committed && (committed.nationality || committed.minExp || committed.type)),
  });

  // ── Map helpers ─────────────────────────────────────
  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    requestLocation(map);
  }, []);

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

  const hasMasterFilter = !!committed;

  // Single Search button: get location + commit master filters
  const handleSearch = () => {
    requestLocation();
    setCommitted({ nationality, minExp, type: activeType });
  };

  const handleCardClick = (salon: Salon) => {
    setSelectedSalon(salon);
    if (salon.latitude != null && salon.longitude != null) {
      setMapCenter({ lat: salon.latitude!, lng: salon.longitude! });
      setMapZoom(15);
      mapRef.current?.panTo({ lat: salon.latitude!, lng: salon.longitude! });
      if (view === "list") setView("split");
    }
  };

  // ── Filtering ───────────────────────────────────────
  const filteredSalons = salons.filter((s) => {
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

  const salonsWithCoords = filteredSalons.filter(
    (s) => s.latitude != null && s.longitude != null
  );

  const showMap = view !== "list";
  const showList = view !== "map";

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex flex-col">
      {/* Header */}
      <div className="px-4 pt-6 pb-4 text-center">
        <div className="text-4xl mb-2">💅</div>
        <h1 className="text-3xl font-bold text-pink-800">Find Your Salon</h1>
        <p className="text-pink-600 mt-1">Discover beauty salons near you</p>
      </div>

      {/* Controls */}
      <div className="px-4 pb-3 flex flex-col gap-2 max-w-6xl mx-auto w-full">

        {/* Row 1: Salon text search + Search button + View toggles */}
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

        {/* Row 3: Master filters */}
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Flag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Master nationality (e.g. French)"
              value={nationality}
              onChange={(e) => setParam("nationality", e.target.value)}
              className="pl-9 bg-white"
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

      {/* Main content: Map + Salon list */}
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
                      {salonsWithCoords.map((salon) => (
                        <Marker
                          key={salon.id}
                          position={{ lat: salon.latitude!, lng: salon.longitude! }}
                          title={salon.name}
                          onClick={() => setSelectedSalon(salon)}
                        />
                      ))}
                      {selectedSalon?.latitude != null && selectedSalon?.longitude != null && (
                        <InfoWindow
                          position={{ lat: selectedSalon.latitude!, lng: selectedSalon.longitude! }}
                          onCloseClick={() => setSelectedSalon(null)}
                        >
                          <div className="p-1 min-w-[160px]">
                            <p className="font-semibold text-sm">{selectedSalon.name}</p>
                            {selectedSalon.address && (
                              <p className="text-xs text-gray-500 mt-0.5">{selectedSalon.address}</p>
                            )}
                            <a
                              href={`/book/${selectedSalon.id}`}
                              className="mt-2 inline-block text-xs font-medium text-pink-600 hover:underline"
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

            {/* Salon list panel */}
            {showList && (
              <div className={`space-y-3 ${view === "split" ? "lg:w-80 lg:overflow-y-auto lg:max-h-[calc(100vh-340px)]" : ""}`}>
                {filteredSalons.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">No salons found</p>
                ) : (
                  filteredSalons.map((salon) => (
                    <SalonCard
                      key={salon.id}
                      salon={salon}
                      isSelected={selectedSalon?.id === salon.id}
                      onClick={() => handleCardClick(salon)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Masters results — shown when any master filter is active */}
      {hasMasterFilter && (
        <div className="px-4 pb-8 max-w-6xl mx-auto w-full">
          <h2 className="text-xl font-bold text-pink-800 mb-3">Masters</h2>
          {mastersLoading ? (
            <div className="flex justify-center py-8">
              <Spinner />
            </div>
          ) : masters.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {masters.map((master) => (
                <MasterCard key={master.id} master={master} />
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">No masters found matching your filters</p>
          )}
        </div>
      )}
    </div>
  );
}

function MasterCard({ master }: { master: Master }) {
  const coverImage = master.avatar_url ?? master.photos?.[0]?.image_url;
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow group bg-white">
      <div className="aspect-square bg-gradient-to-br from-pink-100 to-purple-100 overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={master.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-pink-300">
            {master.name.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-base truncate">{master.name}</h3>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
          {master.nationality && (
            <span className="flex items-center gap-1">
              <Flag className="h-3 w-3" />{master.nationality}
            </span>
          )}
          {master.experience_years != null && (
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />{master.experience_years}y exp
            </span>
          )}
        </div>
        {master.bio && (
          <p className="mt-2 text-xs text-muted-foreground line-clamp-2">{master.bio}</p>
        )}
        <div className="mt-3 flex gap-2">
          <Link to={`/masters/${master.id}`} className="flex-1">
            <Button variant="outline" size="sm" className="w-full">View Profile</Button>
          </Link>
          <Link to={`/book?master_id=${master.id}`} className="flex-1">
            <Button size="sm" className="w-full bg-pink-600 hover:bg-pink-700">Book</Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function SalonCard({ salon, isSelected, onClick }: { salon: Salon; isSelected: boolean; onClick: () => void }) {
  return (
    <Card
      className={`cursor-pointer transition-all hover:shadow-md hover:-translate-y-0.5 ${isSelected ? "ring-2 ring-pink-500 shadow-md" : ""}`}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-gray-900 truncate">{salon.name}</h2>
            {salon.description && (
              <p className="text-gray-600 text-xs mt-0.5 line-clamp-2">{salon.description}</p>
            )}
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
              {salon.address && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-pink-500 shrink-0" />
                  <span className="truncate">{salon.address}</span>
                </span>
              )}
              {salon.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="h-3 w-3 text-pink-500 shrink-0" />
                  {salon.phone}
                </span>
              )}
            </div>
          </div>
          {salon.latitude != null && salon.longitude != null && (
            <MapPin className="h-4 w-4 text-pink-400 shrink-0 mt-0.5" />
          )}
        </div>
        <div className="mt-3">
          <a
            href={`/book/${salon.id}`}
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
