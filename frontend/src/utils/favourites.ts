/** Favourite (saved) providers, stored per device. Pure helpers — see favourites.test.ts. */
export const FAVOURITES_KEY = "pb_saved"; // existing key, keeps users' saved providers

type KV = Pick<Storage, "getItem" | "setItem">;

export function readFavourites(storage: KV | undefined): number[] {
  try {
    const raw = JSON.parse(storage?.getItem(FAVOURITES_KEY) ?? "[]");
    return Array.isArray(raw) ? [...new Set(raw.map(Number).filter((n) => Number.isInteger(n) && n > 0))] : [];
  } catch {
    return [];
  }
}

/** Toggle an id; newly saved providers go first so the Favourites tab shows the latest on top. */
export function toggleFavouriteId(list: number[], id: number): number[] {
  return list.includes(id) ? list.filter((x) => x !== id) : [id, ...list];
}

export function writeFavourites(storage: KV | undefined, list: number[]): void {
  try {
    storage?.setItem(FAVOURITES_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable — keeps working for this session */
  }
}
