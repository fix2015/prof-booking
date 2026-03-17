import { apiClient } from "./client";
import type { Review, ReviewStats } from "@/types";

export const reviewsApi = {
  list: (params?: { master_id?: number; salon_id?: number; skip?: number; limit?: number }) =>
    apiClient.get<Review[]>("/reviews/", { params }),

  create: (data: {
    professional_id: number;
    provider_id: number;
    client_name: string;
    client_phone?: string;
    rating: number;
    comment?: string;
    images?: string[];
    session_id?: number;
  }) => apiClient.post<Review>("/reviews/", data),

  masterStats: (masterId: number) =>
    apiClient.get<ReviewStats>(`/reviews/stats/master/${masterId}`),

  togglePublish: (reviewId: number, published: boolean) =>
    apiClient.patch(`/reviews/${reviewId}/publish`, null, { params: { published } }),
};
