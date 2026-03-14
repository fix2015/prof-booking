import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Calendar, Users, Settings, BarChart2,
  Scissors, LogOut, Shield, Bell,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navItems: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Calendar", href: "/calendar", icon: Calendar, roles: ["master", "salon_owner"] },
  { label: "Sessions", href: "/sessions", icon: Scissors },
  { label: "Masters", href: "/masters", icon: Users, roles: ["salon_owner", "platform_admin"] },
  { label: "Services", href: "/services", icon: Settings, roles: ["salon_owner"] },
  { label: "Reports", href: "/reports", icon: BarChart2 },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Admin", href: "/admin", icon: Shield, roles: ["platform_admin"] },
];

export function Sidebar() {
  const { pathname } = useLocation();
  const { role, logout } = useAuth();

  const filtered = navItems.filter((item) => !item.roles || item.roles.includes(role || ""));

  return (
    <div className="flex w-64 flex-col border-r bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <span className="text-xl font-bold text-pink-600">💅 NailSalon</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {filtered.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-pink-50 text-pink-700"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                  )}
                >
                  <Icon className={cn("h-5 w-5", active ? "text-pink-600" : "text-gray-400")} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="border-t p-3">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-gray-600"
          onClick={() => logout()}
        >
          <LogOut className="h-5 w-5" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
