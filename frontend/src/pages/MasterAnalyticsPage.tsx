import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Clock, Users, DollarSign } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { analyticsApi } from "@/api/analytics";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { formatCurrency } from "@/utils/formatters";

export function MasterAnalyticsPage() {
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 2);
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().slice(0, 10));

  const { data: analytics, isLoading } = useQuery({
    queryKey: ["analytics", "master", dateFrom, dateTo],
    queryFn: () =>
      analyticsApi.masterSummary({ date_from: dateFrom, date_to: dateTo }).then((r) => r.data),
  });

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <TrendingUp className="h-6 w-6" /> My Analytics
          </h1>
          <p className="text-muted-foreground text-sm">Your performance overview</p>
        </div>

        <div className="flex items-center gap-2 text-sm">
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

      {isLoading ? (
        <Spinner className="mx-auto" />
      ) : !analytics ? (
        <div className="text-center py-16 text-muted-foreground">No data available.</div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            <StatCard icon={<Users className="h-5 w-5" />} label="Clients" value={analytics.unique_clients} color="text-blue-600" bg="bg-blue-50" />
            <StatCard icon={<Clock className="h-5 w-5" />} label="Hours Worked" value={`${analytics.total_hours}h`} color="text-purple-600" bg="bg-purple-50" />
            <StatCard icon={<TrendingUp className="h-5 w-5" />} label="Sessions" value={analytics.completed_sessions} color="text-green-600" bg="bg-green-50" />
            <StatCard icon={<DollarSign className="h-5 w-5" />} label="Revenue" value={formatCurrency(analytics.total_revenue)} color="text-pink-600" bg="bg-pink-50" />
          </div>

          {/* Monthly chart */}
          {analytics.monthly_breakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={analytics.monthly_breakdown} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
                    <Tooltip formatter={(v: number) => [`$${v}`, "Revenue"]} />
                    <Bar dataKey="revenue" fill="#ec4899" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Per-salon breakdown */}
          {analytics.salon_breakdown.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>By Location</CardTitle>
              </CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-muted-foreground">
                      <th className="px-4 py-3">Location ID</th>
                      <th className="px-4 py-3 text-right">Sessions</th>
                      <th className="px-4 py-3 text-right">Hours</th>
                      <th className="px-4 py-3 text-right">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.salon_breakdown.map((sb) => (
                      <tr key={sb.salon_id} className="border-b hover:bg-muted/40">
                        <td className="px-4 py-3">Salon #{sb.salon_id}</td>
                        <td className="px-4 py-3 text-right">{sb.sessions}</td>
                        <td className="px-4 py-3 text-right">{sb.hours.toFixed(1)}h</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(sb.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: string;
  bg: string;
}) {
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`rounded-full ${bg} ${color} p-2`}>{icon}</div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
