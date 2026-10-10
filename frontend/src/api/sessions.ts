import apiClient from "./client";
import { Session } from "@/types";

export interface SessionFilters {
  provider_id?: number;
  professional_id?: number;
  // Backward-compat aliases (also accepted by the API)
  salon_id?: number;
  master_id?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
  skip?: number;
  limit?: number;
}

export interface AgendaItem {
  id: number;
  starts_at: string;
  ends_at: string;
  status: string;
  late_cancelled: boolean;
  client_name: string;
  client_phone: string;
  client_notes?: string | null;
  service_name?: string | null;
  professional_id?: number | null;
  professional_name?: string | null;
  price?: number | null;
}

export const sessionsApi = {
  /** Today view: the owner's provider (or the professional's own) appointments on a local date. */
  agenda: (date: string) => apiClient.get<AgendaItem[]>("/sessions/agenda", { params: { date } }).then((r) => r.data),

  setAttendance: (id: number, outcome: "attended" | "no_show" | "late_cancel") =>
    apiClient.post<Session>(`/sessions/${id}/attendance`, { outcome }).then((r) => r.data),

  list: (filters: SessionFilters = {}) =>
    apiClient.get<Session[]>("/sessions/", { params: filters }).then((r) => r.data),

  today: () => apiClient.get<Session[]>("/sessions/today").then((r) => r.data),

  getById: (id: number) => apiClient.get<Session>(`/sessions/${id}`).then((r) => r.data),

  update: (id: number, data: Partial<Session>) =>
    apiClient.patch<Session>(`/sessions/${id}`, data).then((r) => r.data),

  recordEarnings: (id: number, earnings_amount: number) =>
    apiClient
      .post<Session>(`/sessions/${id}/earnings`, { earnings_amount })
      .then((r) => r.data),
};
