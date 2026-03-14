import { MasterReport } from "@/types";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { DollarSign, Scissors } from "lucide-react";
import { formatCurrency } from "@/utils/formatters";

interface MasterAnalyticsProps {
  report: MasterReport;
}

export function MasterAnalytics({ report }: MasterAnalyticsProps) {
  const { summary, daily_earnings } = report;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <StatsCard
          title="Sessions Completed"
          value={summary.sessions_completed}
          icon={Scissors}
          color="pink"
        />
        <StatsCard
          title="Total Earnings"
          value={formatCurrency(summary.total_earnings)}
          icon={DollarSign}
          color="green"
        />
      </div>
      <RevenueChart data={daily_earnings} title="Daily Earnings" type="bar" />
    </div>
  );
}
