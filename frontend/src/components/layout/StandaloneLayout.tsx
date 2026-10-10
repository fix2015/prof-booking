import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import { RouteFallback } from "@/components/shared/RouteFallback";

/** Full-screen pages without the tab bar or dashboard shell (detail, booking, auth, legal): main landmark only. */
export function StandaloneLayout() {
  return (
    <main>
      <Suspense fallback={<RouteFallback fullScreen />}>
        <Outlet />
      </Suspense>
    </main>
  );
}
