import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft, Sparkles, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { useAuthContext } from "@/context/AuthContext";

interface Props {
  /** If true (default), show a ← back button that uses browser history. */
  showBack?: boolean;
}

export function PublicHeader({ showBack = true }: Props) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="max-w-6xl mx-auto flex h-14 items-center gap-3 px-4">
        {/* Back button */}
        {showBack && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground shrink-0"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        )}

        {/* Logo — always links to home */}
        <Link
          to="/"
          className="flex items-center gap-2 font-bold text-foreground shrink-0"
        >
          <Sparkles className="h-4 w-4 text-foreground" />
          <span className="text-base">
            <span className="font-bold">Pro</span>
            <span className="font-light tracking-wide">Book</span>
          </span>
        </Link>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Right side */}
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {isAuthenticated ? (
            <Button asChild size="sm" variant="outline">
              <Link to="/dashboard">Dashboard</Link>
            </Button>
          ) : (
            <Button asChild size="sm">
              <Link to="/login">
                <LogIn className="h-4 w-4 mr-1.5" />
                Login
              </Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
