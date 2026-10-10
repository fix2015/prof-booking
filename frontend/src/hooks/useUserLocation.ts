import { useEffect, useState } from "react";
import type { UserLocation } from "@/utils/filters";

export type LocationStatus = "idle" | "locating" | "ready" | "denied" | "unavailable";

/**
 * The device location for distance filtering / nearest sorting. Prompts only when `wanted` (the user picked a
 * distance); if permission was already granted it is used silently for "nearest" sorting.
 */
export function useUserLocation(wanted: boolean) {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [status, setStatus] = useState<LocationStatus>("idle");

  useEffect(() => {
    if (location || typeof navigator === "undefined" || !navigator.geolocation) {
      if (!navigator?.geolocation) setStatus("unavailable");
      return;
    }
    let cancelled = false;
    const locate = () => {
      setStatus("locating");
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          if (cancelled) return;
          setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setStatus("ready");
        },
        (err) => !cancelled && setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"),
        { enableHighAccuracy: false, timeout: 10_000, maximumAge: 10 * 60_000 },
      );
    };
    if (wanted) {
      locate();
    } else if (navigator.permissions?.query) {
      navigator.permissions.query({ name: "geolocation" as PermissionName })
        .then((p) => { if (p.state === "granted" && !cancelled) locate(); })
        .catch(() => {});
    }
    return () => { cancelled = true; };
  }, [wanted, location]);

  return { location, status };
}
