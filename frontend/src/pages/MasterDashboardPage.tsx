import { DollarSign, Scissors, Calendar, Clock } from "lucide-react";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SessionsList } from "@/components/dashboard/SessionsList";
import { Spinner } from "@/components/ui/spinner";
import { useTodaySessions, useSessions } from "@/hooks/useBooking";
import { useMyMasterProfile } from "@/hooks/useMaster";
import { formatCurrency } from "@/utils/formatters";
import { format, subDays } from "date-fns";

export function MasterDashboardPage() {
  const { data: master } = useMyMasterProfile();
  const { data: todaySessions, isLoading } = useTodaySessions();
  const { data: monthlySessions } = useSessions({
    date_from: format(subDays(new Date(), 30), "yyyy-MM-dd"),
    status: "completed",
  });

  const totalMonthlyEarnings = monthlySessions?.reduce(
    (sum, s) => sum + (s.earnings_amount || 0),
    0
  ) ?? 0;

  const upcomingSessions = todaySessions?.filter(
    (s) => ["pending", "confirmed"].includes(s.status)
  ) ?? [];

  if (isLoading) return <Spinner className="mx-auto mt-20" />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {master?.name || "Master"}!
        </h1>
        <p className="text-muted-foreground">Here's your overview for today.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          title="Today's Sessions"
          value={todaySessions?.length ?? 0}
          icon={Scissors}
          color="pink"
        />
        <StatsCard
          title="Upcoming"
          value={upcomingSessions.length}
          icon={Clock}
          color="blue"
        />
        <StatsCard
          title="This Month"
          value={monthlySessions?.length ?? 0}
          subtitle="completed sessions"
          icon={Calendar}
          color="purple"
        />
        <StatsCard
          title="Monthly Earnings"
          value={formatCurrency(totalMonthlyEarnings)}
          icon={DollarSign}
          color="green"
        />
      </div>

      {/* Today's sessions */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SessionsList
          sessions={todaySessions ?? []}
          title="Today's Sessions"
        />
        <SessionsList
          sessions={upcomingSessions}
          title="Upcoming Sessions"
        />
      </div>
    </div>
  );
}
