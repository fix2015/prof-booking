import apiClient from "./client";
import { Salon } from "@/types";

export const salonsApi = {
  listPublic: () => apiClient.get<Salon[]>("/salons/public").then((r) => r.data),

  getPublic: (id: number) =>
    apiClient.get<Salon>(`/salons/public/${id}`).then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<Salon>(`/salons/${id}`).then((r) => r.data),

  update: (id: number, data: Partial<Salon>) =>
    apiClient.patch<Salon>(`/salons/${id}`, data).then((r) => r.data),

  listAll: () => apiClient.get<Salon[]>("/salons/").then((r) => r.data),
};
