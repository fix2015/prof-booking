import { DollarSign, Scissors, Users, TrendingUp } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SessionsList } from "@/components/dashboard/SessionsList";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { Spinner } from "@/components/ui/spinner";
import { ImageUpload } from "@/components/ui/ImageUpload";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reportsApi } from "@/api/reports";
import { providersApi } from "@/api/salons";
import { sessionsApi } from "@/api/sessions";
import { format, subDays } from "date-fns";
import { formatCurrency } from "@/utils/formatters";

export function OwnerDashboardPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const monthAgo = format(subDays(new Date(), 30), "yyyy-MM-dd");

  const { data: providers } = useQuery({
    queryKey: ["providers", "public"],
    queryFn: () => providersApi.listPublic(),
  });

  const provider = providers?.[0];
  const providerId = provider?.id;

  const qc = useQueryClient();
  const updateProvider = useMutation({
    mutationFn: (logoUrl: string) => providersApi.update(providerId!, { logo_url: logoUrl || undefined }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["providers"] }),
  });

  const { data: report, isLoading } = useQuery({
    queryKey: ["reports", "provider", providerId, monthAgo, today],
    queryFn: () => reportsApi.getProviderReport(providerId!, monthAgo, today),
    enabled: !!providerId,
  });

  const { data: todaySessions } = useQuery({
    queryKey: ["sessions", "today-owner", providerId],
    queryFn: () => sessionsApi.list({ provider_id: providerId, date_from: today, date_to: today }),
    enabled: !!providerId,
  });

  if (isLoading && providerId) return <Spinner className="mx-auto mt-20" />;

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center gap-3">
        <ImageUpload
          currentUrl={provider?.logo_url ?? undefined}
          onUpload={(url) => providerId && updateProvider.mutate(url)}
          shape="square"
          size={64}
          label="Provider Logo"
        />
        <div className="min-w-0">
          <h1 className="text-xl md:text-2xl font-bold truncate">{provider?.name ?? "Provider Dashboard"}</h1>
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
          title="Active Professionals"
          value={report?.professional_performance?.length ?? 0}
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
