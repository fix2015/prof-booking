import { apiClient } from "./client";
import type { WorkerAnalytics, MasterAnalytics } from "@/types";

export const analyticsApi = {
  ownerWorkers: (
    salonId: number,
    params?: { date_from?: string; date_to?: string }
  ) =>
    apiClient.get<WorkerAnalytics[]>(`/analytics/owner/salon/${salonId}/workers`, { params }),

  masterSummary: (params?: { salon_id?: number; date_from?: string; date_to?: string }) =>
    apiClient.get<MasterAnalytics>("/analytics/master/me/summary", { params }),
};
