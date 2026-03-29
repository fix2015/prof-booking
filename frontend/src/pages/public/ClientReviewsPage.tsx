import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuthContext } from "@/context/AuthContext";
import { useGuestSession } from "@/hooks/useGuestSession";
import { reviewsApi } from "@/api/reviews";
import { AppHeader } from "@/components/mobile/AppHeader";
import { t } from "@/i18n";
import type { Review } from "@/types";

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-[2px]">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path
            d="M7 1l1.5 3.2L12 4.8l-2.5 2.4.6 3.4L7 9.1 3.9 10.6l.6-3.4L2 4.8l3.5-.6L7 1Z"
            fill={i < rating ? "var(--ds-feedback-saved)" : "none"}
            stroke={i < rating ? "var(--ds-feedback-saved)" : "var(--ds-border-strong)"}
            strokeWidth="1"
          />
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="bg-ds-bg-primary border border-ds-border rounded-ds-xl mx-ds-4 p-ds-3 flex flex-col gap-[6px]">
      <div className="flex items-start justify-between gap-ds-2">
        <StarRating rating={review.rating} />
        <span className="ds-caption text-ds-text-muted shrink-0">
          {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </div>
      {review.comment && (
        <p className="ds-body text-ds-text-secondary">{review.comment}</p>
      )}
    </div>
  );
}

export function ClientReviewsPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthContext();
  const { guestProfile } = useGuestSession();

  const phone = isAuthenticated ? user?.phone : guestProfile?.phone;

  const { data: reviews = [], isLoading } = useQuery<Review[]>({
    queryKey: ["client-reviews", phone],
    queryFn: () => reviewsApi.list({ client_phone: phone }).then((r) => r.data),
    enabled: !!phone,
    staleTime: 0,
  });

  return (
    <div className="max-w-[768px] mx-auto min-h-screen flex flex-col bg-ds-bg-secondary">
      <AppHeader variant="back-title" title={t("profile.my_reviews")} onBack={() => navigate(-1)} />

      {isLoading && (
        <div className="flex flex-col gap-ds-2 mt-ds-3 px-ds-4">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-[80px] bg-ds-bg-primary rounded-ds-xl animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && reviews.length === 0 && (
        <div className="flex flex-col items-center justify-center flex-1 gap-ds-3 px-ds-6 py-ds-10">
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" className="text-ds-text-muted">
            <path d="M24 4l4.5 9.6L39 15.3l-7.5 7.2 1.8 10.2L24 27.4l-9.3 5.3 1.8-10.2L9 15.3l10.5-1.7L24 4Z"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className="ds-body-strong text-ds-text-primary text-center">{t("reviews.no_reviews_title")}</p>
          <p className="ds-body text-ds-text-secondary text-center">{t("reviews.no_reviews_body")}</p>
        </div>
      )}

      {!isLoading && reviews.length > 0 && (
        <div className="flex flex-col gap-ds-2 mt-ds-3">
          {reviews.map((r) => (
            <ReviewCard key={r.id} review={r} />
          ))}
        </div>
      )}
    </div>
  );
}
