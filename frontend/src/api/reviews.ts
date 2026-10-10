import { apiClient } from "./client";
import type { Review, ReviewStats } from "@/types";

export type ReviewReportReason = "spam" | "inappropriate" | "harassment" | "other";

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

  /** Report an objectionable review (App Store guideline 1.2). Requires sign-in; 409 if already reported. */
  report: (reviewId: number, reason: ReviewReportReason, note?: string) =>
    apiClient.post(`/reviews/${reviewId}/report`, { reason, note }),

  togglePublish: (reviewId: number, published: boolean) =>
    apiClient.patch(`/reviews/${reviewId}/publish`, null, { params: { published } }),
};
