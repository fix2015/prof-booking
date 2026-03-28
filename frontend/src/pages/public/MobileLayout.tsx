import { Outlet } from "react-router-dom";
import { MobileShell } from "@/components/mobile/MobileShell";
import { BottomTabBar } from "@/components/mobile/BottomTabBar";

export function MobileLayout() {
  return (
    <MobileShell>
      <div className="min-h-[calc(100vh-56px)] pb-[56px]">
        <Outlet />
      </div>
      <BottomTabBar />
    </MobileShell>
  );
}
