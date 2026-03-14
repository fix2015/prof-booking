import { DollarSign, Scissors, Users, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SessionsList } from "@/components/dashboard/SessionsList";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { Spinner } from "@/components/ui/spinner";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reportsApi } from "@/api/reports";
import { salonsApi } from "@/api/salons";
import { sessionsApi } from "@/api/sessions";
import { format, subDays } from "date-fns";
import { formatCurrency } from "@/utils/formatters";

export function OwnerDashboardPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const monthAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");

  // Get owned salon via list (simplified - in production store salon_id in JWT or profile)
  const { data: salons } = useQuery({
    queryKey: ["salons", "all"],
    queryFn: () => salonsApi.listPublic(),
  });

  const salon = salons?.[0];
  const salonId = salon?.id;

  const qc = useQueryClient();
  const updateSalon = useMutation({
    mutationFn: (logoUrl: string) => salonsApi.update(salonId!, { logo_url: logoUrl || undefined }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["salons"] }),
  });

  const { data: report, isLoading } = useQuery({
    queryKey: ["reports", "salon", salonId, monthAgo, today],
    queryFn: () => reportsApi.getSalonReport(salonId!, monthAgo, today),
    enabled: !!salonId,
  });

  const { data: todaySessions } = useQuery({
    queryKey: ["sessions", "today-owner", salonId],
    queryFn: () => sessionsApi.list({ salon_id: salonId, date_from: today, date_to: today }),
    enabled: !!salonId,
  });

  if (isLoading && salonId) return <Spinner className="mx-auto mt-20" />;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-3">
        <ImageUpload
          currentUrl={salon?.logo_url ?? undefined}
          onUpload={(url) => salonId && updateSalon.mutate(url)}
          shape="square"
          size={64}
          label="Salon Logo"
        />
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold truncate">{salon?.name ?? "Salon Dashboard"}</h1>
          <p className="text-sm text-muted-foreground">Last 30 days performance overview</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:gap-4 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(report?.summary.total_revenue ?? 0)}
          icon={DollarSign}
          color="green"
        />
        <StatsCard
          title="Sessions"
          value={report?.summary.total_sessions ?? 0}
          subtitle={`${report?.summary.completed_sessions ?? 0} completed`}
          icon={Scissors}
          color="pink"
        />
        <StatsCard
          title="Completion Rate"
          value={`${Math.round(
            report?.summary.total_sessions
              ? ((report.summary.completed_sessions) / report.summary.total_sessions) * 100
              : 0
          )}%`}
          icon={TrendingUp}
          color="blue"
        />
        <StatsCard
          title="Active Masters"
          value={report?.master_performance.length ?? 0}
          icon={Users}
          color="purple"
        />
      </div>

      {/* Revenue chart */}
      {report && <RevenueChart data={report.daily_revenue} />}

      {/* Today's sessions */}
      <SessionsList
        sessions={todaySessions ?? []}
        title="Today's Sessions"
        showDate={false}
      />
    </div>
  );
}
