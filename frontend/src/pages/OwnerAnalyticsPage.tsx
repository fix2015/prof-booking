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

  const { data: providers = [] } = useQuery({
    queryKey: ["providers", "public"],
    queryFn: () => providersApi.listPublic(),
  });
  const providerId = providers[0]?.id;

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
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <BarChart2 className="h-6 w-6" /> Worker Analytics
          </h1>
          <p className="text-muted-foreground text-sm">Detailed breakdown by team member</p>
        </div>

        {/* Date range picker */}
        <div className="flex items-center gap-2 text-sm flex-wrap">
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
          <span className="text-muted-foreground">to</span>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="border rounded px-2 py-1 text-sm"
          />
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <SummaryCard icon={<Users className="h-5 w-5" />} label="Workers" value={workers.length} />
        <SummaryCard icon={<BarChart2 className="h-5 w-5" />} label="Sessions" value={totals.sessions} />
        <SummaryCard icon={<Clock className="h-5 w-5" />} label="Hours Worked" value={`${totals.hours.toFixed(1)}h`} />
        <SummaryCard icon={<DollarSign className="h-5 w-5" />} label="Total Revenue" value={formatCurrency(totals.revenue)} />
      </div>

      {/* Split summary */}
      {totals.revenue > 0 && (
        <Card>
          <CardContent className="p-4 flex flex-wrap gap-6">
            <div>
              <p className="text-sm text-muted-foreground">Professionals earned</p>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totals.professionalEarnings)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Provider earned</p>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(totals.providerEarnings)}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Workers table */}
      {isLoading ? (
        <Spinner className="mx-auto" />
      ) : workers.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">No worker data for this period.</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Team Performance</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="px-4 py-3">Professional</th>
                  <th className="px-4 py-3 text-right">Sessions</th>
                  <th className="px-4 py-3 text-right">Hours</th>
                  <th className="px-4 py-3 text-right">Revenue</th>
                  <th className="px-4 py-3 text-right">Professional Earns</th>
                  <th className="px-4 py-3 text-right">Provider Earns</th>
                  <th className="px-4 py-3 text-right">Split</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w: WorkerAnalytics) => (
                  <tr key={w.professional_id} className="border-b hover:bg-muted/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {w.avatar_url ? (
                          <img src={w.avatar_url} alt={w.professional_name} className="h-7 w-7 rounded-full object-cover" />
                        ) : (
                          <div className="h-7 w-7 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-700">
                            {w.professional_name.charAt(0)}
                          </div>
                        )}
                        {w.professional_name}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">{w.completed_sessions}</td>
                    <td className="px-4 py-3 text-right">{w.total_hours}h</td>
                    <td className="px-4 py-3 text-right">{formatCurrency(w.total_revenue)}</td>
                    <td className="px-4 py-3 text-right text-green-600">{formatCurrency(w.professional_earnings)}</td>
                    <td className="px-4 py-3 text-right text-blue-600">{formatCurrency(w.provider_earnings)}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{w.professional_percentage}%</td>
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
      <CardContent className="p-4 flex items-center gap-3">
        <div className="rounded-full bg-gray-50 p-2 text-gray-700">{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
