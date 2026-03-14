import apiClient from "./client";
import type { Master, MasterSalon, MasterPhoto } from "@/types";

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

  discover: (params?: {
    search?: string;
    nationality?: string;
    min_experience?: number;
    salon_id?: number;
    skip?: number;
    limit?: number;
  }) => apiClient.get<Master[]>("/masters/discover", { params }).then((r) => r.data),

  getPhotos: (masterId: number) =>
    apiClient.get<MasterPhoto[]>(`/masters/${masterId}/photos`).then((r) => r.data),

  addPhoto: (data: { image_url: string; caption?: string; order?: number }) =>
    apiClient
      .post<MasterPhoto>("/masters/me/photos", null, {
        params: { image_url: data.image_url, caption: data.caption, order: data.order ?? 0 },
      })
      .then((r) => r.data),

  deletePhoto: (photoId: number) =>
    apiClient.delete(`/masters/me/photos/${photoId}`),

  createDirect: (
    salonId: number,
    data: {
      email: string;
      name: string;
      phone: string;
      password: string;
      bio?: string;
      nationality?: string;
      experience_years?: number;
      payment_amount?: number;
    }
  ) =>
    apiClient
      .post<MasterSalon>(`/masters/salon/${salonId}/create`, data)
      .then((r) => r.data),
};
