import { describe, expect, it } from "vitest";
import { DEFAULT_FILTERS, FILTERS_KEY, countActiveFilters, loadDiscover, saveDiscover, searchParamsFor } from "./filters";

function memory() {
  const data = new Map<string, string>();
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
}

describe("discover filters", () => {
  it("persists and restores the last filters and category", () => {
    const store = memory();
    saveDiscover(store, { filters: { ...DEFAULT_FILTERS, minRating: 4, openNow: true, date: "2030-01-09" }, category: "Gel" });
    const back = loadDiscover(store, "2030-01-07");
    expect(back.category).toBe("Gel");
    expect(back.filters).toMatchObject({ minRating: 4, openNow: true, date: "2030-01-09", sort: "nearest" });
  });

  it("drops stale dates and ignores corrupt or mistyped values", () => {
    const store = memory();
    store.setItem(FILTERS_KEY, JSON.stringify({ filters: { date: "2030-01-01", minRating: "4", openNow: 1, maxDistanceKm: 5 } }));
    const back = loadDiscover(store, "2030-01-07").filters;
    expect(back.date).toBe("");
    expect(back.minRating).toBe(0);
    expect(back.openNow).toBe(false);
    expect(back.maxDistanceKm).toBe(5);
    store.setItem(FILTERS_KEY, "{oops");
    expect(loadDiscover(store, "2030-01-07").filters).toEqual(DEFAULT_FILTERS);
    expect(loadDiscover(undefined, "2030-01-07").category).toBe("All");
  });

  it("counts active filters", () => {
    expect(countActiveFilters(DEFAULT_FILTERS)).toBe(0);
    expect(countActiveFilters({ ...DEFAULT_FILTERS, minPrice: "10", maxPrice: "50", openNow: true, maxDistanceKm: 3 })).toBe(3);
  });

  it("builds API params with the local clock and only uses distance with a location", () => {
    const now = new Date(2030, 0, 7, 9, 5);
    const f = { ...DEFAULT_FILTERS, minPrice: "10", minRating: 4.5, openNow: true, maxDistanceKm: 5 };
    expect(searchParamsFor(f, now, null)).toMatchObject({
      min_price: 10, max_price: undefined, min_rating: 4.5, open_now: true,
      now_date: "2030-01-07", now_time: "09:05", radius_km: undefined, lat: undefined,
    });
    expect(searchParamsFor(f, now, { lat: 51.5, lng: -0.1 })).toMatchObject({ lat: 51.5, lng: -0.1, radius_km: 5 });
    expect(searchParamsFor(DEFAULT_FILTERS, now, null).open_now).toBeUndefined();
  });
});
