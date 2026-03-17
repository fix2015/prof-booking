import { Bell, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { initials } from "@/utils/formatters";

const roleLabel: Record<string, string> = {
  provider_owner: "Provider Dashboard",
  professional: "Professional Dashboard",
  platform_admin: "Platform Administration",
};

const profileHref: Record<string, string> = {
  professional: "/profile/professional",
  provider_owner: "/profile/provider",
};

export function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const { user } = useAuth();
  const href = user?.role ? profileHref[user.role] : undefined;

  return (
    <header className="flex h-14 md:h-16 items-center justify-between border-b bg-card px-3 md:px-6 shrink-0">
      <div className="flex items-center gap-2 md:gap-3 min-w-0">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden shrink-0"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <span className="hidden md:block text-sm text-muted-foreground truncate">
          {user?.role ? roleLabel[user.role] ?? "" : ""}
        </span>
      </div>

      <div className="flex items-center gap-1 md:gap-2 shrink-0">
        <LanguageSwitcher />

        <Link to="/notifications">
          <Button variant="ghost" size="icon">
            <Bell className="h-5 w-5 text-muted-foreground" />
          </Button>
        </Link>

        <ThemeToggle />

        {href ? (
          <Link to={href}>
            <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-secondary text-xs md:text-sm font-semibold text-secondary-foreground hover:bg-accent transition-colors cursor-pointer">
              {user ? initials(user.email.split("@")[0]) : "?"}
            </div>
          </Link>
        ) : (
          <div className="flex h-8 w-8 md:h-9 md:w-9 items-center justify-center rounded-full bg-secondary text-xs md:text-sm font-semibold text-secondary-foreground">
            {user ? initials(user.email.split("@")[0]) : "?"}
          </div>
        )}
      </div>
    </header>
  );
}
