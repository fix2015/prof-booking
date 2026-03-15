import { ProviderReport } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RevenueChart } from "@/components/dashboard/RevenueChart";
import { formatCurrency, formatPercent } from "@/utils/formatters";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { DollarSign, Scissors, TrendingUp } from "lucide-react";

interface SalonAnalyticsProps {
  report: ProviderReport;
}

export function SalonAnalytics({ report }: SalonAnalyticsProps) {
  const { summary, service_popularity, professional_performance, daily_revenue } = report;

  return (
    <div className="space-y-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          title="Total Revenue"
          value={formatCurrency(summary.total_revenue)}
          icon={DollarSign}
          color="green"
        />
        <StatsCard
          title="Total Sessions"
          value={summary.total_sessions}
          subtitle={`${summary.completed_sessions} completed`}
          icon={Scissors}
          color="slate"
        />
        <StatsCard
          title="Completion Rate"
          value={formatPercent(
            summary.total_sessions > 0
              ? (summary.completed_sessions / summary.total_sessions) * 100
              : 0
          )}
          icon={TrendingUp}
          color="blue"
        />
        <StatsCard
          title="Total Deposits"
          value={formatCurrency(summary.total_deposits)}
          icon={DollarSign}
          color="purple"
        />
      </div>

      {/* Revenue chart */}
      <RevenueChart data={daily_revenue} title="Daily Revenue" type="area" />

      {/* Service popularity */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Service Popularity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {service_popularity.map((svc) => (
              <div key={svc.service_id} className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-sm">{svc.service_name}</p>
                  <p className="text-xs text-muted-foreground">{svc.booking_count} bookings</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm">{formatCurrency(svc.total_revenue)}</p>
                </div>
              </div>
            ))}
            {service_popularity.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No data</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Professional performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Professional Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="pb-2 font-medium">Professional</th>
                  <th className="pb-2 font-medium">Completed</th>
                  <th className="pb-2 font-medium">Rate</th>
                  <th className="pb-2 font-medium text-right">Earnings</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {professional_performance.map((m) => (
                  <tr key={m.professional_id}>
                    <td className="py-2 font-medium">{m.professional_name}</td>
                    <td className="py-2">{m.sessions_completed}</td>
                    <td className="py-2">{formatPercent(m.completion_rate)}</td>
                    <td className="py-2 text-right">{formatCurrency(m.total_earnings)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {professional_performance.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">No data</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
