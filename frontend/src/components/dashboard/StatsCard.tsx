import { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/utils/cn";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: "slate" | "blue" | "green" | "purple";
  href?: string;
}

const colorMap = {
  slate: { bg: "bg-secondary", icon: "text-foreground", accent: "text-foreground" },
  blue: { bg: "bg-blue-50 dark:bg-blue-950", icon: "text-blue-600 dark:text-blue-400", accent: "text-blue-600 dark:text-blue-400" },
  green: { bg: "bg-green-50 dark:bg-green-950", icon: "text-green-600 dark:text-green-400", accent: "text-green-600 dark:text-green-400" },
  purple: { bg: "bg-purple-50 dark:bg-purple-950", icon: "text-purple-600 dark:text-purple-400", accent: "text-purple-600 dark:text-purple-400" },
};

export function StatsCard({ title, value, subtitle, icon: Icon, trend, color = "slate", href }: StatsCardProps) {
  const colors = colorMap[color];

  const card = (
    <Card className={cn("animate-fade-in h-full", href && "cursor-pointer hover:shadow-md transition-shadow")}>
      <CardContent className="p-4 md:p-6 h-full flex flex-col justify-between">
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs md:text-sm font-medium text-muted-foreground leading-tight">{title}</p>
          <div className={cn("rounded-lg p-2 md:p-3 shrink-0", colors.bg)}>
            <Icon className={cn("h-4 w-4 md:h-6 md:w-6", colors.icon)} />
          </div>
        </div>
        <div className="mt-2">
          <p className="text-xl md:text-3xl font-bold truncate">{value}</p>
          {subtitle && <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>}
          {trend && (
            <p className={cn("mt-1 text-xs font-medium", trend.value >= 0 ? "text-green-600" : "text-red-600")}>
              {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return href ? <Link to={href} className="h-full block">{card}</Link> : card;
}
