import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/utils/cn";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: { value: number; label: string };
  color?: "pink" | "blue" | "green" | "purple";
}

const colorMap = {
  pink: { bg: "bg-pink-50", icon: "text-pink-600", accent: "text-pink-600" },
  blue: { bg: "bg-blue-50", icon: "text-blue-600", accent: "text-blue-600" },
  green: { bg: "bg-green-50", icon: "text-green-600", accent: "text-green-600" },
  purple: { bg: "bg-purple-50", icon: "text-purple-600", accent: "text-purple-600" },
};

export function StatsCard({ title, value, subtitle, icon: Icon, trend, color = "pink" }: StatsCardProps) {
  const colors = colorMap[color];

  return (
    <Card className="animate-fade-in">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-2 text-3xl font-bold">{value}</p>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            {trend && (
              <p className={cn("mt-1 text-xs font-medium", trend.value >= 0 ? "text-green-600" : "text-red-600")}>
                {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
              </p>
            )}
          </div>
          <div className={cn("rounded-lg p-3", colors.bg)}>
            <Icon className={cn("h-6 w-6", colors.icon)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
