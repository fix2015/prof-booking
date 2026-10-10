import { describe, expect, it } from "vitest";
import { FAVOURITES_KEY, readFavourites, toggleFavouriteId, writeFavourites } from "./favourites";
import { rebookUrl } from "./slots";

function memory(initial?: string) {
  const data = new Map<string, string>(initial ? [[FAVOURITES_KEY, initial]] : []);
  return { getItem: (k: string) => data.get(k) ?? null, setItem: (k: string, v: string) => void data.set(k, v) };
}

describe("favourites", () => {
  it("reads defensively", () => {
    expect(readFavourites(undefined)).toEqual([]);
    expect(readFavourites(memory("not json"))).toEqual([]);
    expect(readFavourites(memory('{"a":1}'))).toEqual([]);
    expect(readFavourites(memory('[3, "4", 3, -1, "x"]'))).toEqual([3, 4]);
  });

  it("toggles with newest first and persists", () => {
    const store = memory("[1,2]");
    const next = toggleFavouriteId(readFavourites(store), 5);
    expect(next).toEqual([5, 1, 2]);
    writeFavourites(store, toggleFavouriteId(next, 1));
    expect(readFavourites(store)).toEqual([5, 2]);
  });
});

describe("book again", () => {
  it("pre-selects service and professional", () => {
    expect(rebookUrl({ provider_id: 4, service_id: 9, professional_id: 2 })).toBe("/book/4?service_id=9&professional_id=2");
    expect(rebookUrl({ provider_id: 4 })).toBe("/book/4");
  });
});
