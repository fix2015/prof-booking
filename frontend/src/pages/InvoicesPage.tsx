import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, Calendar } from "lucide-react";
import { invoicesApi } from "@/api/invoices";
import { salonsApi } from "@/api/salons";
import { mastersApi } from "@/api/masters";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/hooks/useToast";
import { formatCurrency } from "@/utils/formatters";
import { useAuth } from "@/hooks/useAuth";
import type { Invoice, InvoiceStatus } from "@/types";

const STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  paid: "bg-green-100 text-green-700",
  overdue: "bg-red-100 text-red-700",
};

export function InvoicesPage() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const isOwner = user?.role === "salon_owner" || user?.role === "platform_admin";

  const [showGenerate, setShowGenerate] = useState(false);
  const [selectedMasterId, setSelectedMasterId] = useState<number | "">("");
  const [periodStart, setPeriodStart] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().slice(0, 10);
  });
  const [periodEnd, setPeriodEnd] = useState(() => new Date().toISOString().slice(0, 10));

  const { data: salons = [] } = useQuery({
    queryKey: ["salons", "public"],
    queryFn: () => salonsApi.listPublic(),
    enabled: isOwner,
  });
  const salonId = salons[0]?.id;

  const { data: masterSalons = [] } = useQuery({
    queryKey: ["masters", "salon", salonId],
    queryFn: () => mastersApi.getSalonMasters(salonId!),
    enabled: !!salonId && isOwner,
  });

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: isOwner ? ["invoices", "salon", salonId] : ["invoices", "me"],
    queryFn: async () => {
      if (isOwner) {
        const res = await invoicesApi.salonInvoices(salonId!);
        return res.data;
      }
      const res = await invoicesApi.myInvoices();
      return res.data;
    },
    enabled: isOwner ? !!salonId : true,
  });

  const generateMutation = useMutation({
    mutationFn: () =>
      invoicesApi.generate(salonId!, {
        master_id: Number(selectedMasterId),
        period_start: periodStart,
        period_end: periodEnd,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      setShowGenerate(false);
      toast({ title: "Invoice generated", variant: "success" });
    },
    onError: () => toast({ title: "Failed to generate invoice", variant: "destructive" }),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: InvoiceStatus }) =>
      invoicesApi.updateStatus(id, status),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["invoices"] });
      toast({ title: "Status updated", variant: "success" });
    },
  });

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" /> Invoices
          </h1>
          <p className="text-muted-foreground text-sm">Monthly earnings statements</p>
        </div>
        {isOwner && (
          <Button onClick={() => setShowGenerate(!showGenerate)}>
            <Plus className="mr-2 h-4 w-4" /> Generate Invoice
          </Button>
        )}
      </div>

      {/* Generate form */}
      {showGenerate && isOwner && (
        <Card>
          <CardHeader><CardTitle>Generate Monthly Invoice</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={selectedMasterId}
                onChange={(e) => setSelectedMasterId(e.target.value === "" ? "" : Number(e.target.value))}
                className="border rounded px-3 py-2 text-sm w-full"
              >
                <option value="">Select master…</option>
                {masterSalons.map((ms) => (
                  <option key={ms.master_id} value={ms.master_id}>
                    Master #{ms.master_id}
                  </option>
                ))}
              </select>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <input
                  type="date"
                  value={periodStart}
                  onChange={(e) => setPeriodStart(e.target.value)}
                  className="border rounded px-2 py-1.5 text-sm w-full"
                />
              </div>
              <input
                type="date"
                value={periodEnd}
                onChange={(e) => setPeriodEnd(e.target.value)}
                className="border rounded px-2 py-1.5 text-sm w-full"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => generateMutation.mutate()}
                disabled={!selectedMasterId || generateMutation.isPending}
              >
                {generateMutation.isPending && <Spinner size="sm" className="mr-2" />}
                Generate
              </Button>
              <Button variant="outline" onClick={() => setShowGenerate(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice list */}
      {isLoading ? (
        <Spinner className="mx-auto" />
      ) : (invoices as Invoice[]).length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No invoices yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(invoices as Invoice[]).map((invoice) => (
            <InvoiceRow
              key={invoice.id}
              invoice={invoice}
              isOwner={isOwner}
              onStatusChange={(status) => statusMutation.mutate({ id: invoice.id, status })}
              isLoading={statusMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function InvoiceRow({
  invoice,
  isOwner,
  onStatusChange,
  isLoading,
}: {
  invoice: Invoice;
  isOwner: boolean;
  onStatusChange: (status: InvoiceStatus) => void;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardContent className="p-3 md:p-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="font-semibold text-sm md:text-base">
                {invoice.period_start} – {invoice.period_end}
              </p>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[invoice.status]}`}>
                {invoice.status.toUpperCase()}
              </span>
            </div>
            <div className="flex flex-wrap gap-2 md:gap-4 text-xs md:text-sm text-muted-foreground">
              <span>{invoice.total_sessions} sessions</span>
              <span>Revenue: {formatCurrency(invoice.total_revenue)}</span>
              <span className="text-green-600">Master: {formatCurrency(invoice.master_earnings)}</span>
              <span className="text-blue-600">Salon: {formatCurrency(invoice.salon_earnings)}</span>
              <span>{invoice.master_percentage}% split</span>
            </div>
          </div>

          {isOwner && (
            <select
              value={invoice.status}
              onChange={(e) => onStatusChange(e.target.value as InvoiceStatus)}
              disabled={isLoading}
              className="border rounded px-2 py-1 text-sm"
            >
              <option value="draft">Draft</option>
              <option value="sent">Sent</option>
              <option value="paid">Paid</option>
              <option value="overdue">Overdue</option>
            </select>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
