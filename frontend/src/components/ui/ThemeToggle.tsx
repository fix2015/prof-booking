import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { Button } from "@/components/ui/button";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  return (
    <Button variant="ghost" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
      {theme === "dark" ? (
        <Sun className="h-5 w-5 text-ds-text-secondary" />
      ) : (
        <Moon className="h-5 w-5 text-ds-text-secondary" />
      )}
    </Button>
  );
}
