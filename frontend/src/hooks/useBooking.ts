import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { calendarApi } from "@/api/calendar";
import { bookingApi, PublicBookingPayload } from "@/api/booking";
import { sessionsApi, SessionFilters } from "@/api/sessions";

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

export function useCreateBooking() {
  return useMutation({
    mutationFn: (data: PublicBookingPayload) => bookingApi.create(data),
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
