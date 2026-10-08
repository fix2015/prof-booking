import apiClient from "./client";
import type { Provider, User } from "@/types";

export interface AdminReview {
  id: number;
  client_name: string;
  rating: number;
  comment?: string;
  is_published: boolean;
  provider_id: number;
  professional_id: number;
  created_at: string;
}

export interface AdminReviewReport {
  id: number;
  reason: string;
  details?: string;
  is_resolved: boolean;
  created_at: string;
  review: { id: number; client_name: string; rating: number; comment?: string; is_published: boolean; provider_id: number };
}

export interface AdminService {
  id: number;
  name: string;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  provider_id: number;
}

export const adminApi = {
  // Providers
  listProviders: () => apiClient.get<Provider[]>("/admin/providers").then((r) => r.data),
  toggleProvider: (id: number, is_active: boolean) =>
    apiClient.patch(`/admin/providers/${id}`, null, { params: { is_active } }),
  deleteProvider: (id: number) => apiClient.delete(`/admin/providers/${id}`),

  // Users
  listUsers: (role?: string) =>
    apiClient.get<User[]>("/admin/users", { params: role ? { role } : {} }).then((r) => r.data),
  toggleUser: (id: number, is_active: boolean) =>
    apiClient.patch(`/admin/users/${id}`, null, { params: { is_active } }),
  deleteUser: (id: number) => apiClient.delete(`/admin/users/${id}`),

  // Reviews
  listReviews: () => apiClient.get<AdminReview[]>("/admin/reviews").then((r) => r.data),
  toggleReview: (id: number, is_published: boolean) =>
    apiClient.patch(`/admin/reviews/${id}`, null, { params: { is_published } }),
  deleteReview: (id: number) => apiClient.delete(`/admin/reviews/${id}`),
  listReviewReports: () => apiClient.get<AdminReviewReport[]>("/admin/review-reports").then((r) => r.data),
  resolveReviewReports: (reviewId: number, is_published: boolean) =>
    apiClient.patch(`/admin/review-reports/${reviewId}/resolve`, null, { params: { is_published } }),

  // Services
  listServices: () => apiClient.get<AdminService[]>("/admin/services").then((r) => r.data),
  toggleService: (id: number, is_active: boolean) =>
    apiClient.patch(`/admin/services/${id}`, null, { params: { is_active } }),
  deleteService: (id: number) => apiClient.delete(`/admin/services/${id}`),
};
