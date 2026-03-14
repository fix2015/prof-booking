import apiClient from "./client";
import { Session } from "@/types";

export interface SessionFilters {
  salon_id?: number;
  master_id?: number;
  status?: string;
  date_from?: string;
  date_to?: string;
  skip?: number;
  limit?: number;
}

export const sessionsApi = {
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
