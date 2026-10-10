/** Discover filters: defaults, persistence and API params. Pure — see filters.test.ts. */
import { localDateString, localTimeString } from "./slots";

export interface FilterValues {
  sort: string;
  date: string;
  minPrice: string;
  maxPrice: string;
  nationality: string;
  minExperience: number;
  minRating: number; // 0 = any
  openNow: boolean;
  maxDistanceKm: number; // 0 = any
}

export const DEFAULT_FILTERS: FilterValues = {
  sort: "nearest",
  date: "",
  minPrice: "",
  maxPrice: "",
  nationality: "",
  minExperience: 0,
  minRating: 0,
  openNow: false,
  maxDistanceKm: 0,
};

export const FILTERS_KEY = "pb_discover_filters_v1";

export interface PersistedDiscover {
  filters: FilterValues;
  category: string;
}

type KV = Pick<Storage, "getItem" | "setItem">;

/** Last used filters + category; unknown/invalid fields fall back to defaults. A past date is dropped. */
export function loadDiscover(storage: KV | undefined, today: string): PersistedDiscover {
  const fallback = { filters: { ...DEFAULT_FILTERS }, category: "All" };
  try {
    const raw = JSON.parse(storage?.getItem(FILTERS_KEY) ?? "null");
    if (!raw || typeof raw !== "object") return fallback;
    const f = raw.filters ?? {};
    const filters: FilterValues = { ...DEFAULT_FILTERS };
    for (const key of Object.keys(DEFAULT_FILTERS) as (keyof FilterValues)[]) {
      if (typeof f[key] === typeof DEFAULT_FILTERS[key]) (filters as unknown as Record<string, unknown>)[key] = f[key];
    }
    if (filters.date && filters.date < today) filters.date = "";
    return { filters, category: typeof raw.category === "string" ? raw.category : "All" };
  } catch {
    return fallback;
  }
}

export function saveDiscover(storage: KV | undefined, value: PersistedDiscover): void {
  try {
    storage?.setItem(FILTERS_KEY, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

export function countActiveFilters(f: FilterValues): number {
  return [
    f.sort !== DEFAULT_FILTERS.sort, !!f.date, !!f.minPrice || !!f.maxPrice, !!f.nationality,
    !!f.minExperience, f.minRating > 0, f.openNow, f.maxDistanceKm > 0,
  ].filter(Boolean).length;
}

export interface UserLocation {
  lat: number;
  lng: number;
}

/** Query params for GET /providers/search from the filters (+ the caller's clock and location). */
export function searchParamsFor(f: FilterValues, now: Date, location: UserLocation | null) {
  return {
    sort: f.sort || undefined,
    available_date: f.date || undefined,
    min_price: f.minPrice ? Number(f.minPrice) : undefined,
    max_price: f.maxPrice ? Number(f.maxPrice) : undefined,
    nationality: f.nationality || undefined,
    min_experience: f.minExperience || undefined,
    min_rating: f.minRating || undefined,
    open_now: f.openNow || undefined,
    now_date: f.openNow ? localDateString(now) : undefined,
    now_time: f.openNow ? localTimeString(now) : undefined,
    lat: location?.lat,
    lng: location?.lng,
    radius_km: location && f.maxDistanceKm ? f.maxDistanceKm : undefined,
  };
}
