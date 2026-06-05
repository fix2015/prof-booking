import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Copy, RefreshCw, Unlink } from "lucide-react";
import { BookingCalendar } from "@/components/calendar/BookingCalendar";
import { useMyWorkSlots, useCreateWorkSlot, useDeleteWorkSlot, useCopyPeriod, useSessions } from "@/hooks/useBooking";
import { useMyProfessionalProfile } from "@/hooks/useMaster";
import { toISODateString, addDays, getWeekStart, addWeeks } from "@/utils/dates";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/useToast";
import { Session, WorkSlot } from "@/types";
import { calendarApi } from "@/api/calendar";
import { useAuthContext } from "@/context/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { professionalsApi } from "@/api/masters";
import { providersApi } from "@/api/salons";
import apiClient from "@/api/client";
import { sessionsApi } from "@/api/sessions";

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function startOfNextMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 1);
}
function endOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}
function startOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 0, 1);
}
function startOfNextYear(d: Date): Date {
  return new Date(d.getFullYear() + 1, 0, 1);
}
function endOfYear(d: Date): Date {
  return new Date(d.getFullYear(), 11, 31);
}

function GoogleCalendarSync() {
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data: status } = useQuery({
    queryKey: ["google-calendar-status"],
    queryFn: () => apiClient.get("/calendar/google/status").then((r) => r.data),
  });

  // Handle OAuth callback redirect
  useEffect(() => {
    const g = searchParams.get("google");
    if (g === "connected") {
      toast({ title: "Google Calendar connected!", variant: "success" });
      qc.invalidateQueries({ queryKey: ["google-calendar-status"] });
      searchParams.delete("google");
      setSearchParams(searchParams, { replace: true });
    } else if (g === "error") {
      toast({ title: "Failed to connect Google Calendar", variant: "destructive" });
      searchParams.delete("google");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams, qc]);

  const connectMutation = useMutation({
    mutationFn: () => apiClient.get("/calendar/google/auth-url").then((r) => r.data),
    onSuccess: (data) => {
      window.location.href = data.auth_url;
    },
    onError: () => toast({ title: "Google Calendar not configured", variant: "destructive" }),
  });

  const syncMutation = useMutation({
    mutationFn: () => apiClient.post("/calendar/google/sync?days_ahead=30").then((r) => r.data),
    onSuccess: (data) => {
      toast({ title: `Synced ${data.synced} events from Google Calendar`, variant: "success" });
      qc.invalidateQueries({ queryKey: ["work-slots"] });
      qc.invalidateQueries({ queryKey: ["google-calendar-status"] });
    },
    onError: (err: any) => {
      toast({ title: err?.response?.data?.detail ?? "Sync failed", variant: "destructive" });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: () => apiClient.delete("/calendar/google/disconnect").then((r) => r.data),
    onSuccess: () => {
      toast({ title: "Google Calendar disconnected" });
      qc.invalidateQueries({ queryKey: ["google-calendar-status"] });
    },
  });

  const connected = status?.connected;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {connected ? (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${syncMutation.isPending ? "animate-spin" : ""}`} />
            {syncMutation.isPending ? "Syncing..." : "Sync Google Calendar"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => disconnectMutation.mutate()}
            disabled={disconnectMutation.isPending}
            className="text-muted-foreground"
          >
            <Unlink className="mr-1 h-3.5 w-3.5" />
            Disconnect
          </Button>
          {status?.last_synced_at && (
            <span className="text-[11px] text-muted-foreground">
              Last synced: {new Date(status.last_synced_at).toLocaleString()}
            </span>
          )}
        </>
      ) : (
        <Button
          variant="outline"
          size="sm"
          onClick={() => connectMutation.mutate()}
          disabled={connectMutation.isPending}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Connect Google Calendar
        </Button>
      )}
    </div>
  );
}


function SessionDetailModal({
  session,
  onClose,
  onNavigateClient,
}: {
  session: Session;
  onClose: () => void;
  onNavigateClient: (phone: string) => void;
}) {
  const queryClient = useQueryClient();
  const start = new Date(session.starts_at);
  const end = new Date(session.ends_at);
  const [editing, setEditing] = useState(false);
  const [editDate, setEditDate] = useState(
    `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, "0")}-${String(start.getDate()).padStart(2, "0")}`
  );
  const [editTime, setEditTime] = useState(
    `${String(start.getHours()).padStart(2, "0")}:${String(start.getMinutes()).padStart(2, "0")}`
  );
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const newStartsAt = `${editDate}T${editTime}:00`;
      await sessionsApi.update(session.id, { starts_at: newStartsAt, duration_minutes: durationMinutes } as any);
      toast({ title: "Session time updated", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      onClose();
    } catch (e: any) {
      toast({ title: e?.response?.data?.detail ?? "Failed to update", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const isCancelled = session.status === "cancelled" || session.status === "completed";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <Card className="w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <CardTitle>Session Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="font-medium">Client:</span> <a href={`/clients?phone=${encodeURIComponent(session.client_phone)}`} className="text-blue-600 hover:underline">{session.client_name}</a></p>
          <p><span className="font-medium">Phone:</span> {session.client_phone}</p>
          <p><span className="font-medium">Status:</span> {session.status}</p>
          <p><span className="font-medium">Price:</span> £{session.price ?? "N/A"}</p>
          <p><span className="font-medium">Duration:</span> {durationMinutes} min</p>
          {session.client_notes && (
            <p><span className="font-medium">Notes:</span> {session.client_notes}</p>
          )}

          {editing ? (
            <div className="space-y-3 pt-2 border-t">
              <p className="font-medium text-sm">Reschedule</p>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium w-12">Date</label>
                <input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium w-12">Time</label>
                <input
                  type="time"
                  value={editTime}
                  onChange={(e) => setEditTime(e.target.value)}
                  className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving..." : "Save"}
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex gap-2 mt-4">
              {!isCancelled && (
                <Button variant="default" className="flex-1" onClick={() => setEditing(true)}>
                  Edit Time
                </Button>
              )}
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => onNavigateClient(session.client_phone)}
              >
                View Client
              </Button>
              <Button variant="outline" className="flex-1" onClick={onClose}>
                Close
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function CalendarPage() {
  const { role } = useAuthContext();
  const navigate = useNavigate();
  const isOwner = role === "provider_owner" || role === "platform_admin";

  const { data: professional, isLoading: professionalLoading } = useMyProfessionalProfile();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [filterProfessionalId, setFilterProfessionalId] = useState<number | undefined>(undefined);

  // Owner: fetch their provider + professionals list
  const { data: myProvider } = useQuery({
    queryKey: ["providers", "my"],
    queryFn: () => providersApi.getMy(),
    enabled: isOwner,
  });
  const { data: providerProfessionals = [] } = useQuery({
    queryKey: ["professionals", "provider", myProvider?.id, "active"],
    queryFn: () => professionalsApi.getProviderProfessionals(myProvider!.id, "active"),
    enabled: isOwner && !!myProvider?.id,
  });

  // Fetch a 6-week window centred on the current calendar date
  const rangeStart = toISODateString(addDays(getWeekStart(currentDate), -7));
  const rangeEnd   = toISODateString(addDays(getWeekStart(currentDate), 35));

  const { data: workSlots = [] } = useMyWorkSlots(rangeStart, rangeEnd);

  const { data: sessions = [] } = useSessions({
    professional_id: isOwner ? filterProfessionalId : professional?.id,
    date_from: rangeStart,
    date_to: rangeEnd,
  });

  const createSlot = useCreateWorkSlot();
  const deleteSlot = useDeleteWorkSlot();
  const copyPeriod = useCopyPeriod();
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [editingSlot, setEditingSlot] = useState<WorkSlot | null>(null);
  const [showCopyPanel, setShowCopyPanel] = useState(false);

  if (!isOwner && professionalLoading) return <Spinner className="mx-auto mt-20" />;
  if (!isOwner && !professional) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Professional profile not found.</p>
      </div>
    );
  }

  const providerId = isOwner
    ? myProvider?.id
    : professional?.professional_providers?.[0]?.provider_id;

  const handleAddSlot = async (date: Date, start: string, end: string) => {
    if (!providerId) {
      toast({ title: "Not linked to a provider", variant: "destructive" });
      return;
    }
    try {
      await createSlot.mutateAsync({
        provider_id: providerId,
        slot_date: toISODateString(date),
        start_time: start,
        end_time: end,
      });
      toast({ title: "Slot added", variant: "success" });
    } catch (e: any) {
      toast({ title: e?.response?.data?.detail ?? "Failed to add slot", variant: "destructive" });
    }
  };

  const handleRemoveSlot = async (slotId: number) => {
    try {
      await deleteSlot.mutateAsync(slotId);
      toast({ title: "Slot removed" });
    } catch {
      toast({ title: "Failed to remove slot", variant: "destructive" });
    }
  };

  const handleCopy = async (label: string, sourceStart: Date, sourceEnd: Date, targetStart: Date) => {
    if (!providerId) { toast({ title: "Not linked to a provider", variant: "destructive" }); return; }
    try {
      const result = await copyPeriod.mutateAsync({
        source_start: toISODateString(sourceStart),
        source_end: toISODateString(sourceEnd),
        target_start: toISODateString(targetStart),
        provider_id: providerId,
      });
      toast({ title: `${result.created} slot${result.created !== 1 ? "s" : ""} copied to ${label}`, variant: "success" });
    } catch (e: any) {
      const msg = e?.response?.data?.detail ?? "No slots found to copy";
      toast({ title: msg, variant: "destructive" });
    }
  };

  const thisWeekStart = getWeekStart(currentDate);
  const thisWeekEnd = addDays(thisWeekStart, 6);
  const nextWeekStart = addWeeks(thisWeekStart, 1);

  const thisMonthStart = startOfMonth(currentDate);
  const thisMonthEnd = endOfMonth(currentDate);
  const nextMonthStart = startOfNextMonth(currentDate);

  const thisYearStart = startOfYear(currentDate);
  const thisYearEnd = endOfYear(currentDate);
  const nextYearStart = startOfNextYear(currentDate);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-xl md:text-2xl font-bold">{isOwner ? "Provider Calendar" : "My Calendar"}</h1>
          <p className="text-muted-foreground text-xs sm:text-sm">
            {isOwner ? "View sessions across your team" : "Manage your work slots and view bookings"}
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {isOwner && providerProfessionals.length > 0 && (
            <select
              value={filterProfessionalId ?? ""}
              onChange={(e) => setFilterProfessionalId(e.target.value ? Number(e.target.value) : undefined)}
              className="border rounded-md px-2 py-1.5 text-xs sm:text-sm max-w-[180px] sm:max-w-none focus:outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="">All professionals</option>
              {providerProfessionals.map((pp: any) => (
                <option key={pp.professional_id} value={pp.professional_id}>
                  {pp.professional?.name ?? `#${pp.professional_id}`}
                </option>
              ))}
            </select>
          )}
          {!isOwner && (
            <>
              <GoogleCalendarSync />
              <Button variant="outline" size="sm" onClick={() => setShowCopyPanel(!showCopyPanel)}>
                <Copy className="mr-2 h-4 w-4" />
                Copy Schedule
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Copy schedule panel — only for professionals */}
      {!isOwner && showCopyPanel && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Copy Schedule</CardTitle>
            <p className="text-xs text-muted-foreground">
              Duplicate your current slots to the next period. Overlapping slots are skipped.
            </p>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              disabled={copyPeriod.isPending}
              onClick={() => handleCopy("next week", thisWeekStart, thisWeekEnd, nextWeekStart)}
            >
              Copy this week → next week
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={copyPeriod.isPending}
              onClick={() => handleCopy("next month", thisMonthStart, thisMonthEnd, nextMonthStart)}
            >
              Copy this month → next month
            </Button>
            <Button
              size="sm"
              variant="outline"
              disabled={copyPeriod.isPending}
              onClick={() => handleCopy("next year", thisYearStart, thisYearEnd, nextYearStart)}
            >
              Copy this year → next year
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="overflow-x-auto -mx-3 md:mx-0 px-3 md:px-0">
      <BookingCalendar
        workSlots={workSlots}
        sessions={sessions}
        onAddSlot={isOwner ? undefined : handleAddSlot}
        onRemoveSlot={isOwner ? undefined : handleRemoveSlot}
        onSlotClick={isOwner ? undefined : setEditingSlot}
        onSessionClick={setSelectedSession}
        onDateChange={setCurrentDate}
      />
      </div>

      {/* Session detail modal */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
          onNavigateClient={(phone) => {
            setSelectedSession(null);
            navigate(`/clients?phone=${encodeURIComponent(phone)}`);
          }}
        />
      )}

      {/* Slot edit modal */}
      {editingSlot && (
        <SlotEditModal
          slot={editingSlot}
          onClose={() => setEditingSlot(null)}
        />
      )}
    </div>
  );
}

function SlotEditModal({ slot, onClose }: { slot: WorkSlot; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [startTime, setStartTime] = useState(slot.start_time.slice(0, 5));
  const [endTime, setEndTime] = useState(slot.end_time.slice(0, 5));
  const [saving, setSaving] = useState(false);
  const valid = endTime > startTime;

  const handleSave = async () => {
    setSaving(true);
    try {
      await calendarApi.updateSlot(slot.id, { start_time: startTime, end_time: endTime });
      toast({ title: "Slot updated", variant: "success" });
      queryClient.invalidateQueries({ queryKey: ["work-slots"] });
      onClose();
    } catch (e: any) {
      toast({ title: e?.response?.data?.detail ?? "Failed to update", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <Card className="w-full max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <CardTitle>Edit Work Slot</CardTitle>
          <p className="text-xs text-muted-foreground">{slot.slot_date}</p>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium w-12">Start</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium w-12">End</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="flex-1 rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>
          {!valid && <p className="text-xs text-destructive">End must be after start</p>}
          <div className="flex gap-2 mt-2">
            <Button className="flex-1" onClick={handleSave} disabled={!valid || saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
