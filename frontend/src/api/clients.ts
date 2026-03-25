import apiClient from "./client";
import type { ClientListItem, ClientDetail, ClientNote, ClientPhoto } from "@/types";

export const clientsApi = {
  list: (params: { search?: string; skip?: number; limit?: number } = {}) =>
    apiClient.get<ClientListItem[]>("/clients/", { params }).then((r) => r.data),

  lookup: (phone: string) =>
    apiClient.get<ClientDetail>("/clients/lookup", { params: { phone } }).then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<ClientDetail>(`/clients/${id}`).then((r) => r.data),

  update: (id: number, data: { name?: string; email?: string; birth_date?: string; avatar_url?: string; tags?: string[] }) =>
    apiClient.patch<ClientDetail>(`/clients/${id}`, data).then((r) => r.data),

  delete: (id: number) =>
    apiClient.delete(`/clients/${id}`),

  addNote: (clientId: number, data: { title: string; content: string }) =>
    apiClient.post<ClientNote>(`/clients/${clientId}/notes`, data).then((r) => r.data),

  updateNote: (clientId: number, noteId: number, data: { title?: string; content?: string }) =>
    apiClient.patch<ClientNote>(`/clients/${clientId}/notes/${noteId}`, data).then((r) => r.data),

  deleteNote: (clientId: number, noteId: number) =>
    apiClient.delete(`/clients/${clientId}/notes/${noteId}`),

  addPhoto: (clientId: number, data: { url: string; caption?: string }) =>
    apiClient.post<ClientPhoto>(`/clients/${clientId}/photos`, data).then((r) => r.data),

  deletePhoto: (clientId: number, photoId: number) =>
    apiClient.delete(`/clients/${clientId}/photos/${photoId}`),
};
