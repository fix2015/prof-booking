import { useState } from "react";
import { useSessions, useUpdateSession, useRecordEarnings } from "@/hooks/useBooking";
import { useAuthContext } from "@/context/AuthContext";
import { Session, SessionStatus } from "@/types";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/utils/dates";
import { formatCurrency, statusColorMap, statusLabel } from "@/utils/formatters";
import { cn } from "@/utils/cn";
import { toast } from "@/hooks/useToast";
import { t } from "@/i18n";

const STATUS_FILTERS: Array<{ value: SessionStatus | "all"; label: string }> = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function SessionsPage() {
  const { role } = useAuthContext();
  const isOwner = role === "provider_owner";
  const [statusFilter, setStatusFilter] = useState<SessionStatus | "all">("all");
  const [earningsModal, setEarningsModal] = useState<Session | null>(null);
  const [earningsAmount, setEarningsAmount] = useState("");

  const { data: sessions = [], isLoading } = useSessions(
    statusFilter !== "all" ? { status: statusFilter } : {}
  );

  const updateSession = useUpdateSession();
  const recordEarnings = useRecordEarnings();

  const handleStatusChange = async (session: Session, newStatus: SessionStatus) => {
    try {
      await updateSession.mutateAsync({ id: session.id, data: { status: newStatus } });
      toast({ title: "Session updated", variant: "success" });
    } catch {
      toast({ title: "Failed to update session", variant: "destructive" });
    }
  };

  const handleRecordEarnings = async () => {
    if (!earningsModal || !earningsAmount) return;
    try {
      await recordEarnings.mutateAsync({ id: earningsModal.id, amount: Number(earningsAmount) });
      toast({ title: "Earnings recorded", variant: "success" });
      setEarningsModal(null);
      setEarningsAmount("");
    } catch {
      toast({ title: "Failed to record earnings", variant: "destructive" });
    }
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">{t("sessions.title")}</h1>

      {/* Status filter */}
      <div className="flex gap-1.5 md:gap-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <Button
            key={f.value}
            variant={statusFilter === f.value ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(f.value)}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <Spinner className="mx-auto mt-12" />
      ) : sessions.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">{t("sessions.no_sessions")}</div>
      ) : (
        <div className="space-y-3">
          {sessions.map((session) => (
            <Card key={session.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-3 md:p-4">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <p className="font-semibold">{session.client_name}</p>
                    <p className="text-sm text-muted-foreground">{session.client_phone}</p>
                    <p className="text-sm text-muted-foreground">
                      {session.starts_at ? formatDateTime(session.starts_at) : "—"}
                    </p>
                    {session.price && (
                      <p className="text-sm font-medium">{formatCurrency(session.price)}</p>
                    )}
                  </div>
                  <div className="flex sm:flex-col items-center sm:items-end gap-2 flex-wrap">
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                        statusColorMap[session.status]
                      )}
                    >
                      {statusLabel[session.status]}
                    </span>
                    {!isOwner && (
                      <div className="flex gap-1">
                        {session.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(session, "confirmed")}
                          >
                            Confirm
                          </Button>
                        )}
                        {session.status === "confirmed" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusChange(session, "in_progress")}
                          >
                            Start
                          </Button>
                        )}
                        {["confirmed", "in_progress"].includes(session.status) && (
                          <Button
                            size="sm"
                            onClick={() => {
                              setEarningsModal(session);
                              setEarningsAmount(String(session.price || ""));
                            }}
                          >
                            Complete
                          </Button>
                        )}
                        {session.status === "pending" && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleStatusChange(session, "cancelled")}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Earnings modal */}
      {earningsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-sm mx-4">
            <CardHeader>
              <CardTitle>Record Earnings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Session with {earningsModal.client_name}
              </p>
              <div className="space-y-1">
                <label className="text-sm font-medium">Earnings Amount ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={earningsAmount}
                  onChange={(e) => setEarningsAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setEarningsModal(null)}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleRecordEarnings}
                  disabled={recordEarnings.isPending}
                >
                  {recordEarnings.isPending ? <Spinner size="sm" className="mr-2" /> : null}
                  Save
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
