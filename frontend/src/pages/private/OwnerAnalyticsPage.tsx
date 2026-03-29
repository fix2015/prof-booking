import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart2, Clock, DollarSign, Users } from "lucide-react";
import { analyticsApi } from "@/api/analytics";
import { providersApi } from "@/api/salons";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency } from "@/utils/formatters";
import type { WorkerAnalytics } from "@/types";

export function OwnerAnalyticsPage() {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  const { data: provider } = useQuery({
    queryKey: ["providers", "my"],
    queryFn: () => providersApi.getMy(),
  });
  const providerId = provider?.id;

  const { data: workers = [], isLoading } = useQuery({
    queryKey: ["analytics", "workers", providerId, dateFrom, dateTo],
    queryFn: () =>
      analyticsApi
        .ownerWorkers(providerId!, { date_from: dateFrom, date_to: dateTo })
        .then((r) => r.data),
    enabled: !!providerId,
  });

  const totals = workers.reduce(
    (acc: { sessions: number; hours: number; revenue: number; professionalEarnings: number; providerEarnings: number }, w: WorkerAnalytics) => ({
      sessions: acc.sessions + w.completed_sessions,
      hours: acc.hours + w.total_hours,
      revenue: acc.revenue + w.total_revenue,
      professionalEarnings: acc.professionalEarnings + w.professional_earnings,
      providerEarnings: acc.providerEarnings + w.provider_earnings,
    }),
    { sessions: 0, hours: 0, revenue: 0, professionalEarnings: 0, providerEarnings: 0 }
  );

  return (
    <div className="space-y-ds-4 md:space-y-ds-6">
      <div className="flex items-center justify-between flex-wrap gap-ds-3">
        <div>
          <h1 className="ds-h2 flex items-center gap-ds-2">
            <BarChart2 className="h-6 w-6" /> Worker Analytics
          </h1>
          <p className="text-ds-text-secondary ds-body">Detailed breakdown by team member</p>
        </div>

        {/* Date range picker */}
        <div className="flex items-center gap-ds-2 ds-body flex-wrap">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border border-ds-border rounded-ds-md px-ds-2 py-[6px] ds-body bg-ds-bg-primary text-ds-text-primary focus:outline-none focus:border-ds-interactive"
          />
          <span className="text-ds-text-muted">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border border-ds-border rounded-ds-md px-ds-2 py-[6px] ds-body bg-ds-bg-primary text-ds-text-primary focus:outline-none focus:border-ds-interactive"
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-ds-3 md:gap-ds-4">
        <SummaryCard icon={<Users className="h-5 w-5" />} label="Workers" value={workers.length} />
        <SummaryCard icon={<BarChart2 className="h-5 w-5" />} label="Sessions" value={totals.sessions} />
        <SummaryCard icon={<Clock className="h-5 w-5" />} label="Hours Worked" value={`${totals.hours.toFixed(1)}h`} />
        <SummaryCard icon={<DollarSign className="h-5 w-5" />} label="Total Revenue" value={formatCurrency(totals.revenue)} />
      </div>

      {/* Split summary */}
      {totals.revenue > 0 && (
        <Card>
          <CardContent className="p-ds-4 flex flex-wrap gap-ds-6">
            <div>
              <p className="ds-body text-ds-text-secondary">Professionals earned</p>
              <p className="ds-h2 text-[var(--ds-feedback-success)]">{formatCurrency(totals.professionalEarnings)}</p>
            </div>
            <div>
              <p className="ds-body text-ds-text-secondary">Provider earned</p>
              <p className="ds-h2 text-[var(--ds-feedback-info)]">{formatCurrency(totals.providerEarnings)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workers table */}
      {isLoading ? (
        <Spinner className="mx-auto" />
      ) : workers.length === 0 ? (
        <div className="text-center py-ds-16 text-ds-text-secondary ds-body">No worker data for this period.</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full ds-body">
              <thead>
                <tr className="border-b border-ds-border text-left text-ds-text-secondary ds-caption">
                  <th className="px-ds-3 py-ds-2 whitespace-nowrap">Professional</th>
                  <th className="px-ds-3 py-ds-2 text-right whitespace-nowrap">Sessions</th>
                  <th className="px-ds-3 py-ds-2 text-right whitespace-nowrap">Hours</th>
                  <th className="px-ds-3 py-ds-2 text-right whitespace-nowrap">Revenue</th>
                  <th className="px-ds-3 py-ds-2 text-right whitespace-nowrap">Pro Earns</th>
                  <th className="px-ds-3 py-ds-2 text-right whitespace-nowrap">Prov Earns</th>
                  <th className="px-ds-3 py-ds-2 text-right whitespace-nowrap">Split</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w: WorkerAnalytics) => (
                  <tr key={w.professional_id} className="border-b border-ds-border hover:bg-ds-bg-secondary transition-colors ds-caption sm:ds-body">
                    <td className="px-ds-3 py-ds-2">
                      <div className="flex items-center gap-ds-2 whitespace-nowrap">
                        {w.avatar_url ? (
                          <img src={w.avatar_url} alt={w.professional_name} className="h-6 w-6 rounded-ds-full object-cover shrink-0" />
                        ) : (
                          <div className="h-6 w-6 rounded-ds-full bg-ds-bg-tertiary flex items-center justify-center ds-caption ds-body-strong text-ds-text-secondary shrink-0">
                            {w.professional_name.charAt(0)}
                          </div>
                        )}
                        <span className="truncate max-w-[100px] sm:max-w-none">{w.professional_name}</span>
                      </div>
                    </td>
                    <td className="px-ds-3 py-ds-2 text-right">{w.completed_sessions}</td>
                    <td className="px-ds-3 py-ds-2 text-right">{w.total_hours}h</td>
                    <td className="px-ds-3 py-ds-2 text-right">{formatCurrency(w.total_revenue)}</td>
                    <td className="px-ds-3 py-ds-2 text-right text-[var(--ds-feedback-success)]">{formatCurrency(w.professional_earnings)}</td>
                    <td className="px-ds-3 py-ds-2 text-right text-[var(--ds-feedback-info)]">{formatCurrency(w.provider_earnings)}</td>
                    <td className="px-ds-3 py-ds-2 text-right text-ds-text-muted">{w.professional_percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

function SummaryCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <Card>
      <CardContent className="p-ds-4 flex items-center gap-ds-3">
        <div className="rounded-ds-full bg-ds-bg-tertiary p-ds-2 text-ds-text-secondary">{icon}</div>
        <div>
          <p className="ds-caption text-ds-text-muted">{label}</p>
          <p className="ds-h3 text-ds-text-primary">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
