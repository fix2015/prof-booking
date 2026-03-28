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
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
          <MessageSquare className="h-6 w-6" /> My Reviews
        </h1>
        <p className="text-muted-foreground text-sm">What clients say about you</p>
      </div>

      {/* Summary card */}
      {reviews.length > 0 && (
        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="text-center sm:border-r sm:pr-6">
              <p className="text-4xl font-bold">{avgRating.toFixed(1)}</p>
              <div className="flex gap-0.5 justify-center my-1">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${i < Math.round(avgRating) ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex-1 space-y-1 w-full">
              {ratingCounts.map(({ star, count }) => (
                <div key={star} className="flex items-center gap-2 text-xs">
                  <span className="w-4 text-right text-muted-foreground">{star}</span>
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 shrink-0" />
                  <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-yellow-400 h-2 rounded-full transition-all"
                      style={{ width: reviews.length > 0 ? `${(count / reviews.length) * 100}%` : "0%" }}
                    />
                  </div>
                  <span className="w-4 text-muted-foreground">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <Spinner className="mx-auto" />
      ) : reviews.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No reviews yet</p>
          <p className="text-xs mt-1">Reviews will appear here after clients complete sessions with you</p>
        </div>
      ) : (
        <div className="space-y-3">
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
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
            <MessageSquare className="h-6 w-6" /> Reviews
          </h1>
          {reviews.length > 0 && (
            <p className="text-muted-foreground text-sm mt-1">
              {reviews.length} reviews · {avgRating.toFixed(1)} ★ average
            </p>
          )}
        </div>
      </div>

      {/* Provider filter */}
      {providers.length > 1 && (
        <div className="flex gap-2 flex-wrap">
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
        <div className="text-center py-16 text-muted-foreground">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-3">
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
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <p className="font-medium">{review.client_name}</p>
              {review.client_phone && (
                <span className="text-xs text-muted-foreground">{review.client_phone}</span>
              )}
              <span className="text-xs text-muted-foreground ml-auto">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>

            <div className="flex gap-0.5 mb-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
                />
              ))}
            </div>

            {review.comment && (
              <p className="text-sm text-muted-foreground">{review.comment}</p>
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
                <Eye className="h-4 w-4 text-green-600" />
              ) : (
                <EyeOff className="h-4 w-4 text-gray-400" />
              )}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
