import apiClient from "./client";
import { Provider } from "@/types";

export const providersApi = {
  listPublic: () => apiClient.get<Provider[]>("/providers/public").then((r) => r.data),

  getPublic: (id: number) =>
    apiClient.get<Provider>(`/providers/public/${id}`).then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<Provider>(`/providers/${id}`).then((r) => r.data),

  update: (id: number, data: Partial<Provider>) =>
    apiClient.patch<Provider>(`/providers/${id}`, data).then((r) => r.data),

  listAll: () => apiClient.get<Provider[]>("/providers/").then((r) => r.data),
};

// Backward-compat alias
export const salonsApi = providersApi;
