import apiClient from "./client";
import type { Professional, ProfessionalProvider, ProfessionalPhoto } from "@/types";

export const professionalsApi = {
  getMe: () => apiClient.get<Professional>("/professionals/me").then((r) => r.data),

  updateMe: (data: Partial<Professional>) =>
    apiClient.patch<Professional>("/professionals/me", data).then((r) => r.data),

  getProviderProfessionalsPublic: (providerId: number) =>
    apiClient.get<Professional[]>(`/professionals/provider/${providerId}/public`).then((r) => r.data),

  getProviderProfessionals: (providerId: number, status?: string) =>
    apiClient
      .get<ProfessionalProvider[]>(`/professionals/provider/${providerId}`, { params: { status } })
      .then((r) => r.data),

  approveProfessional: (providerId: number, professionalId: number, status: string, paymentAmount?: number) =>
    apiClient
      .patch<ProfessionalProvider>(`/professionals/provider/${providerId}/${professionalId}/approval`, {
        status,
        payment_amount: paymentAmount,
      })
      .then((r) => r.data),

  getById: (id: number) => apiClient.get<Professional>(`/professionals/${id}`).then((r) => r.data),

  discover: (params?: {
    search?: string;
    nationality?: string;
    min_experience?: number;
    provider_id?: number;
    service_name?: string;
    is_independent?: boolean;
    skip?: number;
    limit?: number;
  }) => apiClient.get<Professional[]>("/professionals/discover", { params }).then((r) => r.data),

  getPhotos: (professionalId: number) =>
    apiClient.get<ProfessionalPhoto[]>(`/professionals/${professionalId}/photos`).then((r) => r.data),

  addPhoto: (data: { image_url: string; caption?: string; order?: number }) =>
    apiClient
      .post<ProfessionalPhoto>("/professionals/me/photos", null, {
        params: { image_url: data.image_url, caption: data.caption, order: data.order ?? 0 },
      })
      .then((r) => r.data),

  deletePhoto: (photoId: number) =>
    apiClient.delete(`/professionals/me/photos/${photoId}`),

  attachToProvider: (providerId: number) =>
    apiClient.post<ProfessionalProvider>(`/professionals/me/providers/${providerId}`).then((r) => r.data),

  detachFromProvider: (providerId: number) =>
    apiClient.delete(`/professionals/me/providers/${providerId}`),

  createDirect: (
    providerId: number,
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
      .post<ProfessionalProvider>(`/professionals/provider/${providerId}/create`, data)
      .then((r) => r.data),
};

// Backward-compat alias
export const mastersApi = {
  ...professionalsApi,
  getSalonMastersPublic: (salonId: number) =>
    professionalsApi.getProviderProfessionalsPublic(salonId),
  getSalonMasters: (salonId: number, status?: string) =>
    professionalsApi.getProviderProfessionals(salonId, status),
  approveMaster: (salonId: number, masterId: number, status: string, paymentAmount?: number) =>
    professionalsApi.approveProfessional(salonId, masterId, status, paymentAmount),
};
