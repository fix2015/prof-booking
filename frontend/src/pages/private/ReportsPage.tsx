import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { reportsApi } from "@/api/reports";
import { providersApi } from "@/api/salons";
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

  const { data: providers } = useQuery({
    queryKey: ["providers", "public"],
    queryFn: () => providersApi.listPublic(),
    enabled: role === "provider_owner",
  });
  const providerId = providers?.[0]?.id;

  const { data: providerReport, isLoading: providerLoading } = useQuery({
    queryKey: ["reports", "provider", providerId, dateFrom, dateTo],
    queryFn: () => reportsApi.getProviderReport(providerId!, dateFrom, dateTo),
    enabled: !!providerId && role === "provider_owner",
  });

  const { data: professionalReport, isLoading: professionalLoading } = useQuery({
    queryKey: ["reports", "professional", "me", dateFrom, dateTo],
    queryFn: () => reportsApi.getMyProfessionalReport(dateFrom, dateTo),
    enabled: role === "professional",
  });

  const isLoading = providerLoading || professionalLoading;

  return (
    <div className="space-y-ds-6">
      <div className="flex items-center justify-between flex-wrap gap-ds-4">
        <h1 className="ds-h2">Reports & Analytics</h1>
        <div className="flex items-center gap-ds-3">
          <div className="space-y-[4px]">
            <Label className="ds-caption">From</Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-36"
            />
          </div>
          <div className="space-y-[4px]">
            <Label className="ds-caption">To</Label>
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

      {providerReport && <SalonAnalytics report={providerReport} />}
      {professionalReport && <MasterAnalytics report={professionalReport} />}

      {!isLoading && !providerReport && !professionalReport && (
        <div className="py-ds-12 text-center text-ds-text-secondary ds-body">
          No report data available for this period.
        </div>
      )}
    </div>
  );
}
