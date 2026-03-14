import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/api/reports";
import { salonsApi } from "@/api/salons";
import { useAuth } from "@/hooks/useAuth";
import { SalonAnalytics } from "@/components/analytics/SalonAnalytics";
import { MasterAnalytics } from "@/components/analytics/MasterAnalytics";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, subDays } from "date-fns";

export function ReportsPage() {
  const { role } = useAuth();
  const [dateFrom, setDateFrom] = useState(format(subDays(new Date(), 30), "yyyy-MM-dd"));
  const [dateTo, setDateTo] = useState(format(new Date(), "yyyy-MM-dd"));

  const { data: salons } = useQuery({
    queryKey: ["salons", "public"],
    queryFn: () => salonsApi.listPublic(),
    enabled: role === "salon_owner",
  });
  const salonId = salons?.[0]?.id;

  const { data: salonReport, isLoading: salonLoading } = useQuery({
    queryKey: ["reports", "salon", salonId, dateFrom, dateTo],
    queryFn: () => reportsApi.getSalonReport(salonId!, dateFrom, dateTo),
    enabled: !!salonId && role === "salon_owner",
  });

  const { data: masterReport, isLoading: masterLoading } = useQuery({
    queryKey: ["reports", "master", "me", dateFrom, dateTo],
    queryFn: () => reportsApi.getMyMasterReport(dateFrom, dateTo),
    enabled: role === "master",
  });

  const isLoading = salonLoading || masterLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Reports & Analytics</h1>
        <div className="flex items-center gap-3">
          <div className="space-y-1">
            <Label className="text-xs">From</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-36"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">To</Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-36"
            />
          </div>
        </div>
      </div>

      {isLoading && <Spinner className="mx-auto mt-12" />}

      {salonReport && <SalonAnalytics report={salonReport} />}
      {masterReport && <MasterAnalytics report={masterReport} />}

      {!isLoading && !salonReport && !masterReport && (
        <div className="py-12 text-center text-muted-foreground">
          No report data available for this period.
        </div>
      )}
    </div>
  );
}
