import { useState } from "react";
import { Copy } from "lucide-react";
import { BookingCalendar } from "@/components/calendar/BookingCalendar";
import { useMyWorkSlots, useCreateWorkSlot, useDeleteWorkSlot, useCopyPeriod, useSessions } from "@/hooks/useBooking";
import { useMyProfessionalProfile } from "@/hooks/useMaster";
import { toISODateString, addDays, getWeekStart, addWeeks } from "@/utils/dates";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/useToast";
import { Session } from "@/types";
import { useAuthContext } from "@/context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { professionalsApi } from "@/api/masters";
import { providersApi } from "@/api/salons";

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

export function CalendarPage() {
  const { role } = useAuthContext();
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
          <p className="text-muted-foreground">
            {isOwner ? "View sessions across your team" : "Manage your work slots and view bookings"}
          </p>
        </div>
        <div className="flex gap-2 items-center flex-wrap">
          {isOwner && providerProfessionals.length > 0 && (
            <select
              value={filterProfessionalId ?? ""}
              onChange={(e) => setFilterProfessionalId(e.target.value ? Number(e.target.value) : undefined)}
              className="border rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
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
            <Button variant="outline" size="sm" onClick={() => setShowCopyPanel(!showCopyPanel)}>
              <Copy className="mr-2 h-4 w-4" />
              Copy Schedule
            </Button>
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
        onSessionClick={setSelectedSession}
        onDateChange={setCurrentDate}
      />
      </div>

      {/* Session detail modal */}
      {selectedSession && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setSelectedSession(null)}
        >
          <Card className="w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Session Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <p><span className="font-medium">Client:</span> {selectedSession.client_name}</p>
              <p><span className="font-medium">Phone:</span> {selectedSession.client_phone}</p>
              <p><span className="font-medium">Status:</span> {selectedSession.status}</p>
              <p><span className="font-medium">Price:</span> ${selectedSession.price ?? "N/A"}</p>
              {selectedSession.client_notes && (
                <p><span className="font-medium">Notes:</span> {selectedSession.client_notes}</p>
              )}
              <Button variant="outline" className="w-full mt-4" onClick={() => setSelectedSession(null)}>
                Close
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
