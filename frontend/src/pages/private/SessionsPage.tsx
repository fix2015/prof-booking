import { useState } from "react";
import { useSessions, useUpdateSession, useRecordEarnings } from "@/hooks/useBooking";
import { useAuthContext } from "@/context/AuthContext";
import { Session, SessionStatus } from "@/types";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SessionCard } from "@/components/sessions/SessionCard";
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

type DateFilter = "all" | "today" | "week" | "month";

const DATE_FILTERS: Array<{ value: DateFilter; label: string }> = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
];

function matchesDateFilter(session: Session, filter: DateFilter): boolean {
  if (filter === "all" || !session.starts_at) return true;
  const date = new Date(session.starts_at);
  const now = new Date();
  if (filter === "today") {
    return date.toDateString() === now.toDateString();
  }
  if (filter === "week") {
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);
    return date >= weekStart && date < weekEnd;
  }
  if (filter === "month") {
    return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }
  return true;
}

export function SessionsPage() {
  const { role } = useAuthContext();
  const isOwner = role === "provider_owner";
  const isProfessional = role === "professional";
  const [statusFilter, setStatusFilter] = useState<SessionStatus | "all">("all");
  const [dateFilter, setDateFilter] = useState<DateFilter>("all");
  const [earningsModal, setEarningsModal] = useState<Session | null>(null);
  const [earningsAmount, setEarningsAmount] = useState("");

  const { data: allSessions = [], isLoading } = useSessions(
    statusFilter !== "all" ? { status: statusFilter } : {}
  );

  const sessions = allSessions.filter((s) => matchesDateFilter(s, dateFilter));

  const updateSession = useUpdateSession();
  const recordEarnings = useRecordEarnings();

  const handleCancel = async (session: Session) => {
    try {
      await updateSession.mutateAsync({ id: session.id, data: { status: "cancelled" } });
      toast({ title: "Session cancelled", variant: "success" });
    } catch {
      toast({ title: "Failed to cancel session", variant: "destructive" });
    }
  };

  const handleConfirm = async (session: Session) => {
    try {
      await updateSession.mutateAsync({ id: session.id, data: { status: "confirmed" } });
      toast({ title: "Session confirmed", variant: "success" });
    } catch {
      toast({ title: "Failed to confirm session", variant: "destructive" });
    }
  };

  const handleComplete = (session: Session) => {
    setEarningsModal(session);
    setEarningsAmount(String(session.price || ""));
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
    <div className="space-y-ds-3 md:space-y-ds-4">
      <h1 className="ds-h2">{t("sessions.title")}</h1>

      {/* Status filter chips */}
      <div className="flex gap-ds-2 flex-wrap">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setStatusFilter(f.value)}
            className={cn(
              "px-ds-3 py-[6px] rounded-ds-full ds-body-small border transition-colors",
              statusFilter === f.value
                ? "bg-ds-interactive border-ds-interactive text-ds-text-inverse"
                : "bg-ds-bg-primary border-ds-border text-ds-text-secondary hover:border-ds-interactive"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Date filter chips */}
      <div className="flex gap-ds-2 flex-wrap">
        {DATE_FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setDateFilter(f.value)}
            className={cn(
              "px-ds-3 py-[4px] rounded-ds-full ds-caption border transition-colors",
              dateFilter === f.value
                ? "bg-ds-interactive border-ds-interactive text-ds-text-inverse"
                : "bg-ds-bg-primary border-ds-border text-ds-text-secondary hover:border-ds-interactive"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Session list */}
      {isLoading ? (
        <Spinner className="mx-auto mt-12" />
      ) : sessions.length === 0 ? (
        <div className="py-ds-12 text-center text-ds-text-secondary ds-body">{t("sessions.no_sessions")}</div>
      ) : (
        <div className="space-y-ds-3">
          {sessions.map((session) => (
            <SessionCard
              key={session.id}
              session={session}
              showCancel
              showConfirm={isOwner || isProfessional}
              showComplete={isProfessional}
              onCancel={handleCancel}
              onConfirm={handleConfirm}
              onComplete={handleComplete}
            />
          ))}
        </div>
      )}

      {/* Earnings modal */}
      {earningsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-sm mx-ds-4">
            <CardHeader>
              <CardTitle>Record Earnings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-ds-4">
              <p className="ds-body text-ds-text-secondary">
                Session with {earningsModal.client_name}
              </p>
              <div className="space-y-[4px]">
                <label className="ds-body-strong text-ds-text-primary">Earnings Amount ($)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={earningsAmount}
                  onChange={(e) => setEarningsAmount(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="flex gap-ds-2">
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
                  {recordEarnings.isPending ? <Spinner size="sm" className="mr-ds-2" /> : null}
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
