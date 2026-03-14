import apiClient from "./client";
import { Master, MasterSalon } from "@/types";

export const mastersApi = {
  getMe: () => apiClient.get<Master>("/masters/me").then((r) => r.data),

  updateMe: (data: Partial<Master>) =>
    apiClient.patch<Master>("/masters/me", data).then((r) => r.data),

  getSalonMastersPublic: (salonId: number) =>
    apiClient.get<Master[]>(`/masters/salon/${salonId}/public`).then((r) => r.data),

  getSalonMasters: (salonId: number, status?: string) =>
    apiClient
      .get<MasterSalon[]>(`/masters/salon/${salonId}`, { params: { status } })
      .then((r) => r.data),

  approveMaster: (salonId: number, masterId: number, status: string, paymentAmount?: number) =>
    apiClient
      .patch<MasterSalon>(`/masters/salon/${salonId}/${masterId}/approval`, {
        status,
        payment_amount: paymentAmount,
      })
      .then((r) => r.data),

  getById: (id: number) => apiClient.get<Master>(`/masters/${id}`).then((r) => r.data),
};
