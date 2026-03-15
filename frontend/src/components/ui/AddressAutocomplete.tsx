import { useState, useRef, useEffect, useCallback } from "react";
import { useLoadScript } from "@react-google-maps/api";
import { MapPin, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/utils/cn";

const LIBRARIES: ["places"] = ["places"];
const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY ?? "";

export interface AddressResult {
  address: string;
  lat?: number;
  lng?: number;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSelect?: (result: AddressResult) => void;
  placeholder?: string;
  className?: string;
  id?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Start typing an address or postcode…",
  className,
  id,
}: Props) {
  const { isLoaded } = useLoadScript({ googleMapsApiKey: API_KEY, libraries: LIBRARIES });

  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initialise services once Maps is loaded
  useEffect(() => {
    if (isLoaded && !serviceRef.current) {
      serviceRef.current = new google.maps.places.AutocompleteService();
      geocoderRef.current = new google.maps.Geocoder();
    }
  }, [isLoaded]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchPredictions = useCallback((input: string) => {
    if (!serviceRef.current || input.length < 2) {
      setPredictions([]);
      setOpen(false);
      return;
    }
    setLoading(true);
    serviceRef.current.getPlacePredictions({ input, types: ["address"] }, (results, status) => {
      setLoading(false);
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        setPredictions(results);
        setOpen(true);
      } else {
        setPredictions([]);
        setOpen(false);
      }
    });
  }, []);

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchPredictions(val), 300);
  };

  const handleSelect = (prediction: google.maps.places.AutocompletePrediction) => {
    const address = prediction.description;
    onChange(address);
    setOpen(false);
    setPredictions([]);

    if (onSelect && geocoderRef.current) {
      geocoderRef.current.geocode({ placeId: prediction.place_id }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results?.[0]) {
          const loc = results[0].geometry.location;
          onSelect({ address, lat: loc.lat(), lng: loc.lng() });
        } else {
          onSelect({ address });
        }
      });
    }
  };

  // Fallback: plain input if Maps not configured or not loaded yet
  if (!API_KEY || !isLoaded) {
    return (
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={className}
      />
    );
  }

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <div className="relative">
        <Input
          id={id}
          value={value}
          onChange={handleInput}
          onFocus={() => predictions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          autoComplete="off"
          className="pr-8"
        />
        {loading && (
          <Loader2 className="absolute right-2.5 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {open && predictions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-md border bg-background shadow-lg max-h-60 overflow-y-auto">
          {predictions.map((p) => (
            <li key={p.place_id}>
              <button
                type="button"
                className="w-full text-left px-3 py-2 hover:bg-muted flex items-start gap-2 text-sm"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(p); }}
              >
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
                <span>
                  <span className="font-medium">
                    {p.structured_formatting.main_text}
                  </span>
                  <span className="text-muted-foreground">
                    {" "}{p.structured_formatting.secondary_text}
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
