import { useCallback, useEffect, useState } from "react";
import { readFavourites, toggleFavouriteId, writeFavourites, FAVOURITES_KEY } from "@/utils/favourites";

const EVENT = "pb:favourites";
const store = () => (typeof window === "undefined" ? undefined : window.localStorage);

/** Favourite providers shared across screens (and browser tabs). */
export function useFavourites() {
  const [favourites, setFavourites] = useState<number[]>(() => readFavourites(store()));

  useEffect(() => {
    const sync = (e: Event) => {
      if (e instanceof StorageEvent && e.key !== FAVOURITES_KEY) return;
      setFavourites(readFavourites(store()));
    };
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const toggleFavourite = useCallback((id: number) => {
    const next = toggleFavouriteId(readFavourites(store()), id);
    writeFavourites(store(), next);
    setFavourites(next);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { favourites, toggleFavourite, isFavourite: (id: number) => favourites.includes(id) };
}
