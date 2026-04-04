import { useState, useEffect, useCallback } from "react";
import axios from "axios";

type Permission = "default" | "granted" | "denied";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function useWebNotifications() {
  const [permission, setPermission] = useState<Permission>(
    typeof Notification !== "undefined" ? (Notification.permission as Permission) : "default"
  );
  const [subscribed, setSubscribed] = useState(false);
  const supported = typeof Notification !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;

  useEffect(() => {
    if (!supported) return;
    setPermission(Notification.permission as Permission);

    // Check if already subscribed
    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setSubscribed(!!sub);
      });
    });
  }, [supported]);

  const requestPermission = useCallback(async () => {
    if (!supported) return "denied" as Permission;
    const result = await Notification.requestPermission();
    setPermission(result as Permission);

    if (result === "granted") {
      try {
        // Get VAPID public key from backend
        const { data } = await axios.get("/api/v1/notifications/push/vapid-public-key");
        if (!data.public_key) return result as Permission;

        const reg = await navigator.serviceWorker.ready;
        let sub = await reg.pushManager.getSubscription();

        if (!sub) {
          sub = await reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(data.public_key) as BufferSource,
          });
        }

        const subJson = sub.toJSON();
        // Send subscription to backend
        await axios.post("/api/v1/notifications/push/subscribe", {
          endpoint: sub.endpoint,
          keys: {
            p256dh: subJson.keys?.p256dh || "",
            auth: subJson.keys?.auth || "",
          },
        });
        setSubscribed(true);
      } catch (err) {
        console.error("Push subscription failed:", err);
      }
    }

    return result as Permission;
  }, [supported]);

  const unsubscribe = useCallback(async () => {
    if (!supported) return;
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await axios.post("/api/v1/notifications/push/unsubscribe", {
          endpoint: sub.endpoint,
        });
        await sub.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      console.error("Push unsubscribe failed:", err);
    }
  }, [supported]);

  return {
    supported,
    permission,
    enabled: permission === "granted" && subscribed,
    requestPermission,
    unsubscribe,
  };
}
