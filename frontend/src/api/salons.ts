import apiClient from "./client";
import { Provider } from "@/types";

export const providersApi = {
  listPublic: (search?: string) =>
    apiClient.get<Provider[]>("/providers/public", { params: search ? { search } : undefined }).then((r) => r.data),

  getPublic: (id: number) =>
    apiClient.get<Provider>(`/providers/public/${id}`).then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<Provider>(`/providers/${id}`).then((r) => r.data),

  update: (id: number, data: Partial<Provider>) =>
    apiClient.patch<Provider>(`/providers/${id}`, data).then((r) => r.data),

  listAll: () => apiClient.get<Provider[]>("/providers/").then((r) => r.data),

  getMy: () => apiClient.get<Provider>("/providers/my").then((r) => r.data),

  create: (data: Partial<Provider>) =>
    apiClient.post<Provider>("/providers/", data).then((r) => r.data),

  getCategories: () =>
    apiClient.get<string[]>("/providers/categories").then((r) => r.data),

  search: (params: {
    q?: string;
    address?: string;
    service_name?: string;
    available_date?: string;
    category?: string;
    min_price?: number;
    max_price?: number;
    nationality?: string;
    min_experience?: number;
    sort?: string;
    skip?: number;
    limit?: number;
  }) =>
    apiClient.get<Provider[]>("/providers/search", { params }).then((r) => r.data),
};

// Backward-compat alias
export const salonsApi = providersApi;
