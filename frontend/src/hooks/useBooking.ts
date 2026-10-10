import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { calendarApi } from "@/api/calendar";
import { bookingApi, PublicBookingPayload } from "@/api/booking";
import { sessionsApi, SessionFilters } from "@/api/sessions";
import { localDateString, localTimeString } from "@/utils/slots";

export function useAvailableDates(
  providerId: number,
  dateFrom: string,
  dateTo: string,
  durationMinutes: number,
  professionalId?: number
) {
  return useQuery({
    queryKey: ["available-dates", providerId, dateFrom, dateTo, durationMinutes, professionalId],
    queryFn: () => calendarApi.getAvailableDates(providerId, dateFrom, dateTo, durationMinutes, professionalId),
    enabled: !!providerId && !!dateFrom && !!dateTo,
  });
}

export function useAvailability(
  providerId: number,
  date: string,
  durationMinutes: number,
  professionalId?: number
) {
  return useQuery({
    queryKey: ["availability", providerId, date, durationMinutes, professionalId],
    queryFn: () => calendarApi.getAvailability(providerId, date, durationMinutes, professionalId),
    enabled: !!providerId && !!date,
  });
}

/** Next free slots for a page of providers (one request per page). */
export function useNextAvailable(providerIds: number[]) {
  const now = new Date();
  const fromDate = localDateString(now);
  return useQuery({
    queryKey: ["next-available", providerIds.join(","), fromDate],
    queryFn: () => calendarApi.getNextAvailable(providerIds, fromDate, localTimeString(new Date())),
    enabled: providerIds.length > 0,
    staleTime: 60_000,
  });
}

export function useCreateBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: PublicBookingPayload) => bookingApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["available-dates"] });
      qc.invalidateQueries({ queryKey: ["availability"] });
    },
  });
}

export function useSessions(filters: SessionFilters = {}) {
  return useQuery({
    queryKey: ["sessions", filters],
    queryFn: () => sessionsApi.list(filters),
  });
}

export function useTodaySessions() {
  return useQuery({
    queryKey: ["sessions", "today"],
    queryFn: () => sessionsApi.today(),
    refetchInterval: 60_000, // refresh every minute
  });
}

export function useUpdateSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Parameters<typeof sessionsApi.update>[1] }) =>
      sessionsApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useRecordEarnings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, amount }: { id: number; amount: number }) =>
      sessionsApi.recordEarnings(id, amount),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["sessions"] }),
  });
}

export function useMyWorkSlots(dateFrom: string, dateTo?: string) {
  return useQuery({
    queryKey: ["work-slots", dateFrom, dateTo],
    queryFn: () => calendarApi.getMySlots(dateFrom, dateTo),
    enabled: !!dateFrom,
  });
}

export function useCreateWorkSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof calendarApi.createSlot>[0]) =>
      calendarApi.createSlot(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["work-slots"] }),
  });
}

export function useDeleteWorkSlot() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slotId: number) => calendarApi.deleteSlot(slotId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["work-slots"] }),
  });
}

export function useCopyPeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Parameters<typeof calendarApi.copyPeriod>[0]) =>
      calendarApi.copyPeriod(data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["work-slots"] }),
  });
}
