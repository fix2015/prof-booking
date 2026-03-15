import { apiClient } from "./client";
import type { WorkerAnalytics, ProfessionalAnalytics } from "@/types";

export const analyticsApi = {
  ownerWorkers: (providerId: number, params?: { date_from?: string; date_to?: string }) =>
    apiClient.get<WorkerAnalytics[]>(`/analytics/owner/provider/${providerId}/workers`, { params }),

  professionalSummary: (params?: { provider_id?: number; date_from?: string; date_to?: string }) =>
    apiClient.get<ProfessionalAnalytics>("/analytics/professional/me/summary", { params }),

  // Backward-compat alias
  masterSummary: (params?: { salon_id?: number; date_from?: string; date_to?: string }) =>
    apiClient.get<ProfessionalAnalytics>("/analytics/professional/me/summary", {
      params: params
        ? { provider_id: params.salon_id, date_from: params.date_from, date_to: params.date_to }
        : undefined,
    }),
};

// Backward-compat type alias
export type { ProfessionalAnalytics as MasterAnalytics };
