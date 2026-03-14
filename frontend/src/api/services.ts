import apiClient from "./client";
import { Service } from "@/types";

export interface ServicePayload {
  name: string;
  description?: string;
  duration_minutes: number;
  price: number;
}

export const servicesApi = {
  listBySalon: (salonId: number) =>
    apiClient.get<Service[]>(`/services/salon/${salonId}`).then((r) => r.data),

  create: (salonId: number, data: ServicePayload) =>
    apiClient.post<Service>(`/services/salon/${salonId}`, data).then((r) => r.data),

  update: (serviceId: number, data: Partial<ServicePayload & { is_active?: boolean }>) =>
    apiClient.patch<Service>(`/services/${serviceId}`, data).then((r) => r.data),

  delete: (serviceId: number) =>
    apiClient.delete(`/services/${serviceId}`),
};
