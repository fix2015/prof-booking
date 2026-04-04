import { useState, useEffect, useCallback } from "react";

type Permission = "default" | "granted" | "denied";

export function useWebNotifications() {
  const [permission, setPermission] = useState<Permission>(
    typeof Notification !== "undefined" ? Notification.permission as Permission : "default"
  );
  const supported = typeof Notification !== "undefined";

  useEffect(() => {
    if (supported) {
      setPermission(Notification.permission as Permission);
    }
  }, [supported]);

  const requestPermission = useCallback(async () => {
    if (!supported) return "denied" as Permission;
    const result = await Notification.requestPermission();
    setPermission(result as Permission);
    return result as Permission;
  }, [supported]);

  const sendNotification = useCallback(
    (title: string, options?: NotificationOptions) => {
      if (!supported || permission !== "granted") return;
      return new Notification(title, {
        icon: "/favicon-32.png",
        badge: "/favicon-32.png",
        ...options,
      });
    },
    [supported, permission]
  );

  return {
    supported,
    permission,
    enabled: permission === "granted",
    requestPermission,
    sendNotification,
  };
}
