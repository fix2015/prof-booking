import apiClient from "./client";
import { Service } from "@/types";

export interface ServicePayload {
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
  provider_id?: number | null;
}

export const servicesApi = {
  listNames: () =>
    apiClient.get<string[]>("/services/names").then((r) => r.data),

  listByProvider: (providerId: number) =>
    apiClient.get<Service[]>(`/services/provider/${providerId}`).then((r) => r.data),

  listByProfessional: (professionalId: number) =>
    apiClient.get<Service[]>(`/services/professional/${professionalId}`).then((r) => r.data),

  listMy: () =>
    apiClient.get<Service[]>("/services/my").then((r) => r.data),

  createForUser: (data: ServicePayload) =>
    apiClient.post<Service>("/services/", data).then((r) => r.data),

  create: (providerId: number, data: ServicePayload) =>
    apiClient.post<Service>(`/services/provider/${providerId}`, data).then((r) => r.data),

  update: (serviceId: number, data: Partial<ServicePayload & { is_active?: boolean }>) =>
    apiClient.patch<Service>(`/services/${serviceId}`, data).then((r) => r.data),

  delete: (serviceId: number) => apiClient.delete(`/services/${serviceId}`),

  // Backward-compat alias
  listBySalon: (salonId: number) =>
    apiClient.get<Service[]>(`/services/provider/${salonId}`).then((r) => r.data),
};
