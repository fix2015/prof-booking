import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard, Calendar, Users, Settings, Settings2, BarChart2,
  Scissors, LogOut, Shield, Bell, Star, FileText, TrendingUp,
  Search, Sparkles, X, User,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { t } from "@/i18n";

interface NavItem {
  labelKey: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[];
}

const navItems: NavItem[] = [
  { labelKey: "nav.dashboard", href: "/dashboard", icon: LayoutDashboard, roles: ["professional", "provider_owner"] },
  { labelKey: "nav.calendar", href: "/calendar", icon: Calendar, roles: ["professional", "provider_owner"] },
  { labelKey: "nav.sessions", href: "/sessions", icon: Scissors, roles: ["professional", "provider_owner"] },
  { labelKey: "nav.professionals", href: "/professionals", icon: Users, roles: ["provider_owner"] },
  { labelKey: "nav.services", href: "/services", icon: Settings, roles: ["professional"] },
  { labelKey: "nav.reviews", href: "/reviews", icon: Star, roles: ["provider_owner"] },
  { labelKey: "nav.analytics", href: "/analytics/owner", icon: BarChart2, roles: ["provider_owner"] },
  { labelKey: "nav.analytics", href: "/analytics/professional", icon: TrendingUp, roles: ["professional"] },
  { labelKey: "nav.reviews", href: "/reviews", icon: Star, roles: ["professional"] },
  { labelKey: "nav.invoices", href: "/invoices", icon: FileText, roles: ["provider_owner", "professional"] },
  { labelKey: "nav.reports", href: "/reports", icon: BarChart2, roles: ["provider_owner"] },
  { labelKey: "nav.notifications", href: "/notifications", icon: Bell, roles: ["professional", "provider_owner"] },
  { labelKey: "nav.admin", href: "/admin", icon: Shield, roles: ["platform_admin"] },
  { labelKey: "nav.analytics", href: "/analytics/owner", icon: BarChart2, roles: ["platform_admin"] },
  { labelKey: "nav.profile", href: "/profile/professional", icon: User, roles: ["professional"] },
  { labelKey: "nav.profile", href: "/profile/provider", icon: Settings2, roles: ["provider_owner"] },
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
        <span className="text-lg md:text-xl font-bold text-foreground truncate"><span className="font-bold">Pro</span><span className="font-light tracking-wide">Book</span></span>
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
                  {t(item.labelKey as Parameters<typeof t>[0])}
                </Link>
              </li>
            );
          })}
        </ul>

        {/* Discovery links — role-specific */}
        {(role === "provider_owner" || role === "professional") && (
          <div className="mt-4 border-t pt-4 space-y-0.5">
            {role === "professional" && (
              <Link
                to="/find-providers"
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                Find Providers
              </Link>
            )}
            {role === "provider_owner" && (
              <Link
                to="/find-professionals"
                onClick={onClose}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
              >
                <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                Find Professionals
              </Link>
            )}
          </div>
        )}
      </nav>

      {/* Logout */}
      <div className="border-t p-2 md:p-3 shrink-0 space-y-2">
        <div className="flex justify-center">
          <LanguageSwitcher />
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground"
          onClick={() => { logout(); onClose?.(); }}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {t("nav.sign_out")}
        </Button>
      </div>
    </div>
  );
}
