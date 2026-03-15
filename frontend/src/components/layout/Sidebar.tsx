import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Calendar, Users, Settings, Settings2, BarChart2,
  Scissors, LogOut, Shield, Bell, Star, FileText, TrendingUp,
  Search, Sparkles, X, User,
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
  { label: "Calendar", href: "/calendar", icon: Calendar, roles: ["professional", "provider_owner"] },
  { label: "Sessions", href: "/sessions", icon: Scissors },
  { label: "Professionals", href: "/professionals", icon: Users, roles: ["provider_owner", "platform_admin"] },
  { label: "Services", href: "/services", icon: Settings, roles: ["provider_owner"] },
  { label: "Reviews", href: "/reviews", icon: Star, roles: ["provider_owner", "platform_admin"] },
  { label: "Analytics", href: "/analytics/owner", icon: BarChart2, roles: ["provider_owner", "platform_admin"] },
  { label: "My Analytics", href: "/analytics/professional", icon: TrendingUp, roles: ["professional"] },
  { label: "Invoices", href: "/invoices", icon: FileText, roles: ["provider_owner", "professional", "platform_admin"] },
  { label: "Reports", href: "/reports", icon: BarChart2, roles: ["provider_owner", "platform_admin"] },
  { label: "Notifications", href: "/notifications", icon: Bell },
  { label: "Admin", href: "/admin", icon: Shield, roles: ["platform_admin"] },
  { label: "My Profile", href: "/profile/professional", icon: User, roles: ["professional"] },
  { label: "Provider Settings", href: "/profile/provider", icon: Settings2, roles: ["provider_owner"] },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
  const { pathname } = useLocation();
  const { role, logout } = useAuth();

  const filtered = navItems.filter((item) => !item.roles || item.roles.includes(role || ""));

  return (
    <div className="flex w-64 flex-col border-r bg-card h-full">
      {/* Logo */}
      <div className="flex h-14 md:h-16 items-center border-b px-4 md:px-6 gap-2 shrink-0">
        <Sparkles className="h-5 w-5 text-foreground shrink-0" />
        <span className="text-lg md:text-xl font-bold text-foreground truncate">BeautyPlatform</span>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-auto lg:hidden p-1 rounded hover:bg-accent"
            aria-label="Close menu"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 md:px-3 py-3 md:py-4">
        <ul className="space-y-0.5">
          {filtered.map((item) => {
            const Icon = item.icon;
            const active = pathname.startsWith(item.href);
            return (
              <li key={item.href}>
                <Link
                  to={item.href}
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-5 w-5 shrink-0", active ? "text-primary-foreground" : "text-muted-foreground")} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Discovery link — hidden from professionals */}
        {role !== "professional" && (
          <div className="mt-4 border-t pt-4">
            <Link
              to="/discover"
              onClick={onClose}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            >
              <Search className="h-5 w-5 text-muted-foreground shrink-0" />
              Discover Professionals
            </Link>
          </div>
        )}
      </nav>

      {/* Logout */}
      <div className="border-t p-2 md:p-3 shrink-0">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={() => { logout(); onClose?.(); }}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          Sign out
        </Button>
      </div>
    </div>
  );
}
