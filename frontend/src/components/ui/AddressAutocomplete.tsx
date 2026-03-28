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
  id?: string;
  className?: string;
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Start typing address or postcode…",
  id,
  className,
}: Props) {
  const { isLoaded } = useLoadScript({ googleMapsApiKey: API_KEY, libraries: LIBRARIES });

  const [predictions, setPredictions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const serviceRef = useRef<google.maps.places.AutocompleteService | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (isLoaded && !serviceRef.current) {
      serviceRef.current = new google.maps.places.AutocompleteService();
      geocoderRef.current = new google.maps.Geocoder();
    }
  }, [isLoaded]);

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

  // Fallback to plain input if key missing or not yet loaded
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
          className="pr-ds-8"
        />
        {loading && (
          <Loader2 className="absolute right-ds-3 top-ds-3 h-4 w-4 animate-spin text-ds-text-secondary" />
        )}
      </div>

      {open && predictions.length > 0 && (
        <ul className="absolute z-50 mt-ds-1 w-full rounded-ds-md border border-ds-border bg-ds-bg-primary shadow-lg max-h-60 overflow-y-auto">
          {predictions.map((p) => (
            <li key={p.place_id}>
              <button
                type="button"
                className="w-full text-left px-ds-3 py-ds-2 hover:bg-ds-bg-secondary flex items-start gap-ds-2 ds-body"
                onMouseDown={(e) => { e.preventDefault(); handleSelect(p); }}
              >
                <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0 text-ds-text-secondary" />
                <span>
                  <span className="ds-body-strong">{p.structured_formatting.main_text}</span>
                  <span className="text-ds-text-secondary"> {p.structured_formatting.secondary_text}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
