import { Bell } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { initials } from "@/utils/formatters";

export function Header() {
  const { user } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b bg-white px-6">
      <div className="text-sm text-gray-500">
        {user?.role === "salon_owner" && "Salon Owner Dashboard"}
        {user?.role === "master" && "Master Dashboard"}
        {user?.role === "platform_admin" && "Platform Administration"}
      </div>

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon">
          <Bell className="h-5 w-5 text-gray-500" />
        </Button>

        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-pink-100 text-sm font-semibold text-pink-700">
          {user ? initials(user.email.split("@")[0]) : "?"}
        </div>
      </div>
    </header>
  );
}
