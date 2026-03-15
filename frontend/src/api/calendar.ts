import apiClient from "./client";
import { WorkSlot, AvailableSlot } from "@/types";

export interface WorkSlotPayload {
  provider_id: number;
  slot_date: string;
  start_time: string;
  end_time: string;
}

export const calendarApi = {
  getAvailability: (providerId: number, date: string, durationMinutes: number, professionalId?: number) =>
    apiClient
      .get<AvailableSlot[]>("/calendar/availability", {
        params: { provider_id: providerId, date, duration_minutes: durationMinutes, professional_id: professionalId },
      })
      .then((r) => r.data),

  getMySlots: (dateFrom: string, dateTo?: string) =>
    apiClient
      .get<WorkSlot[]>("/calendar/slots/my", { params: { date_from: dateFrom, date_to: dateTo } })
      .then((r) => r.data),

  createSlot: (data: WorkSlotPayload) =>
    apiClient.post<WorkSlot>("/calendar/slots", data).then((r) => r.data),

  deleteSlot: (slotId: number) => apiClient.delete(`/calendar/slots/${slotId}`),

  copyWeek: (data: { source_week_start: string; target_week_start: string; provider_id: number }) =>
    apiClient.post<{ created: number }>("/calendar/slots/copy-week", data).then((r) => r.data),

  copyPeriod: (data: { source_start: string; source_end: string; target_start: string; provider_id: number }) =>
    apiClient.post<{ created: number }>("/calendar/slots/copy-period", data).then((r) => r.data),
};
