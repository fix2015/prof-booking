import { apiClient } from "./client";
import type { LoyaltyProgram, DiscountRule, DiscountType } from "@/types";

export const loyaltyApi = {
  listPrograms: (salonId: number) =>
    apiClient.get<LoyaltyProgram[]>(`/loyalty/salon/${salonId}`),

  createProgram: (
    salonId: number,
    data: { name: string; description?: string; is_active?: boolean }
  ) => apiClient.post<LoyaltyProgram>(`/loyalty/salon/${salonId}`, data),

  updateProgram: (
    programId: number,
    data: { name?: string; description?: string; is_active?: boolean }
  ) => apiClient.patch<LoyaltyProgram>(`/loyalty/${programId}`, data),

  addRule: (
    programId: number,
    data: {
      name: string;
      discount_type: DiscountType;
      discount_value: number;
      conditions?: Record<string, unknown>;
      is_active?: boolean;
    }
  ) => apiClient.post<DiscountRule>(`/loyalty/${programId}/rules`, data),

  deleteRule: (programId: number, ruleId: number) =>
    apiClient.delete(`/loyalty/${programId}/rules/${ruleId}`),
};
