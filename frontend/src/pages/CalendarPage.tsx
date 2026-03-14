import { useState } from "react";
import { BookingCalendar } from "@/components/calendar/BookingCalendar";
import { useMyWorkSlots, useCreateWorkSlot, useDeleteWorkSlot, useSessions } from "@/hooks/useBooking";
import { useMyMasterProfile } from "@/hooks/useMaster";
import { toISODateString, addDays } from "@/utils/dates";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/useToast";
import { Session } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function CalendarPage() {
  const { data: master, isLoading: masterLoading } = useMyMasterProfile();
  const today = toISODateString(new Date());
  const [weekStart] = useState(today);

  const { data: workSlots = [] } = useMyWorkSlots(
    weekStart,
    toISODateString(addDays(new Date(weekStart), 13))
  );

  const { data: sessions = [] } = useSessions({
    master_id: master?.id,
    date_from: weekStart,
    date_to: toISODateString(addDays(new Date(weekStart), 13)),
  });

  const createSlot = useCreateWorkSlot();
  const deleteSlot = useDeleteWorkSlot();

  const [selectedSession, setSelectedSession] = useState<Session | null>(null);

  if (masterLoading) return <Spinner className="mx-auto mt-20" />;
  if (!master) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Master profile not found.</p>
      </div>
    );
  }

  const handleAddSlot = async (date: Date, start: string, end: string) => {
    if (!master.master_salons?.[0]?.salon_id) {
      toast({ title: "Not linked to a salon", variant: "destructive" });
      return;
    }
    try {
      await createSlot.mutateAsync({
        salon_id: master.master_salons![0].salon_id,
        slot_date: toISODateString(date),
        start_time: start,
        end_time: end,
      });
      toast({ title: "Slot added", variant: "success" });
    } catch (e) {
      toast({ title: "Failed to add slot", description: (e as Error)?.message, variant: "destructive" });
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Calendar</h1>
          <p className="text-muted-foreground">Manage your work slots and view bookings</p>
        </div>
      </div>

      <BookingCalendar
        workSlots={workSlots}
        sessions={sessions}
        onAddSlot={handleAddSlot}
        onRemoveSlot={handleRemoveSlot}
        onSessionClick={setSelectedSession}
      />

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
