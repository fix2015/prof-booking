import { apiClient } from "./client";
import type { Review, ReviewStats } from "@/types";

export const reviewsApi = {
  list: (params?: { professional_id?: number; provider_id?: number; client_phone?: string; skip?: number; limit?: number }) =>
    apiClient.get<Review[]>("/reviews/", { params }),

  create: (data: {
    professional_id: number;
    provider_id?: number;
    client_name: string;
    client_phone?: string;
    rating: number;
    comment?: string;
    images?: string[];
    session_id?: number;
  }) => apiClient.post<Review>("/reviews/", data),

  masterStats: (professionalId: number) =>
    apiClient.get<ReviewStats>(`/reviews/stats/professional/${professionalId}`),

  togglePublish: (reviewId: number, published: boolean) =>
    apiClient.patch(`/reviews/${reviewId}/publish`, null, { params: { published } }),
};
