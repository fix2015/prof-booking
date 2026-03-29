import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Eye, EyeOff, MessageSquare } from "lucide-react";
import { reviewsApi } from "@/api/reviews";
import { providersApi } from "@/api/salons";
import { useMyProfessionalProfile } from "@/hooks/useMaster";
import { useAuthContext } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/hooks/useToast";
import type { Review } from "@/types";

export function ReviewsPage() {
  const { role } = useAuthContext();
  const isProfessional = role === "professional";

  if (isProfessional) return <ProfessionalReviewsPage />;
  return <OwnerReviewsPage />;
}

function ProfessionalReviewsPage() {
  const { data: professional, isLoading: profLoading } = useMyProfessionalProfile();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews", "me", professional?.id],
    queryFn: () =>
      reviewsApi.list({ professional_id: professional!.id, limit: 100 }).then((r) => r.data),
    enabled: !!professional?.id,
  });

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / reviews.length
      : 0;

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r: Review) => r.rating === star).length,
  }));

  if (profLoading) return <Spinner className="mx-auto mt-20" />;

  return (
    <div className="space-y-ds-4 md:space-y-ds-6">
      <div>
        <h1 className="ds-h2 flex items-center gap-ds-2">
          <MessageSquare className="h-6 w-6" /> My Reviews
        </h1>
        <p className="text-ds-text-secondary ds-body">What clients say about you</p>
      </div>

      {/* Summary card */}
      {reviews.length > 0 && (
        <Card>
          <CardContent className="p-ds-4 flex flex-col sm:flex-row gap-ds-4 items-start sm:items-center">
            <div className="text-center sm:border-r sm:border-ds-border sm:pr-ds-6">
              <p className="ds-h1 text-ds-text-primary">{avgRating.toFixed(1)}</p>
              <div className="flex gap-[2px] justify-center my-[4px]">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.round(avgRating) ? "fill-[var(--ds-feedback-rating)] text-[var(--ds-feedback-rating)]" : "text-ds-text-disabled"}`}
                  />
                ))}
              </div>
              <p className="ds-caption text-ds-text-muted">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex-1 space-y-[4px] w-full">
              {ratingCounts.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-ds-2 ds-caption">
                  <span className="w-4 text-right text-ds-text-muted">{star}</span>
                  <Star className="h-3 w-3 fill-[var(--ds-feedback-rating)] text-[var(--ds-feedback-rating)] shrink-0" />
                  <div className="flex-1 bg-ds-bg-tertiary rounded-ds-full h-2 overflow-hidden">
                    <div
                      className="bg-[var(--ds-feedback-rating)] h-2 rounded-ds-full transition-all"
                      style={{ width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="w-4 text-ds-text-muted">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Spinner className="mx-auto" />
      ) : reviews.length === 0 ? (
        <div className="text-center py-ds-16 text-ds-text-secondary">
          <MessageSquare className="h-12 w-12 mx-auto mb-ds-3 opacity-30" />
          <p className="ds-body">No reviews yet</p>
          <p className="ds-caption mt-[4px]">Reviews will appear here after clients complete sessions with you</p>
        </div>
      ) : (
        <div className="space-y-ds-3">
          {reviews.map((review: Review) => (
            <ReviewRow key={review.id} review={review} />
          ))}
        </div>
      )}
    </div>
  );
}

function OwnerReviewsPage() {
  const qc = useQueryClient();
  const [providerFilter, setProviderFilter] = useState<number | null>(null);

  const { data: providers = [] } = useQuery({
    queryKey: ["providers", "public"],
    queryFn: () => providersApi.listPublic(),
  });

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["reviews", "all", providerFilter],
    queryFn: () =>
      reviewsApi.list({ provider_id: providerFilter ?? undefined, limit: 100 } as any).then((r) => r.data),
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, published }: { id: number; published: boolean }) =>
      reviewsApi.togglePublish(id, published),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["reviews"] });
      toast({ title: "Review updated", variant: "success" });
    },
  });

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum: number, r: Review) => sum + r.rating, 0) / reviews.length
      : 0;

  return (
    <div className="space-y-ds-4 md:space-y-ds-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="ds-h2 flex items-center gap-ds-2">
            <MessageSquare className="h-6 w-6" /> Reviews
          </h1>
          {reviews.length > 0 && (
            <p className="text-ds-text-secondary ds-body mt-[4px]">
              {reviews.length} reviews · {avgRating.toFixed(1)} ★ average
            </p>
          )}
        </div>
      </div>

      {/* Provider filter */}
      {providers.length > 1 && (
        <div className="flex gap-ds-2 flex-wrap">
          <Button
            size="sm"
            variant={providerFilter === null ? "default" : "outline"}
            onClick={() => setProviderFilter(null)}
          >
            All Providers
          </Button>
          {providers.map((p) => (
            <Button
              key={p.id}
              size="sm"
              variant={providerFilter === p.id ? "default" : "outline"}
              onClick={() => setProviderFilter(p.id)}
            >
              {p.name}
            </Button>
          ))}
        </div>
      )}

      {isLoading ? (
        <Spinner className="mx-auto" />
      ) : reviews.length === 0 ? (
        <div className="text-center py-ds-16 text-ds-text-secondary">
          <MessageSquare className="h-12 w-12 mx-auto mb-ds-3 opacity-30" />
          <p className="ds-body">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-ds-3">
          {reviews.map((review: Review) => (
            <ReviewRow
              key={review.id}
              review={review}
              onToggle={(published) => toggleMutation.mutate({ id: review.id, published })}
              isLoading={toggleMutation.isPending}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ReviewRow({
  review,
  onToggle,
  isLoading,
}: {
  review: Review;
  onToggle?: (published: boolean) => void;
  isLoading?: boolean;
}) {
  return (
    <Card className={review.is_published ? "" : "opacity-60"}>
      <CardContent className="p-ds-4">
        <div className="flex items-start justify-between gap-ds-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-ds-2 flex-wrap mb-[4px]">
              <p className="ds-body-strong text-ds-text-primary">{review.client_name}</p>
              <span className="ds-caption text-ds-text-muted ml-auto">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>

            <div className="flex gap-[2px] mb-[4px]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < review.rating ? "fill-[var(--ds-feedback-rating)] text-[var(--ds-feedback-rating)]" : "text-ds-text-disabled"}`}
                />
              ))}
            </div>

            {review.comment && (
              <p className="ds-body text-ds-text-secondary">{review.comment}</p>
            )}
          </div>

          {onToggle && (
            <Button
              size="sm"
              variant="ghost"
              disabled={isLoading}
              onClick={() => onToggle(!review.is_published)}
              title={review.is_published ? "Hide review" : "Publish review"}
            >
              {review.is_published ? (
                <Eye className="h-4 w-4 text-[var(--ds-feedback-success)]" />
              ) : (
                <EyeOff className="h-4 w-4 text-ds-text-muted" />
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
