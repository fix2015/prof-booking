import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Eye, EyeOff, MessageSquare } from "lucide-react";
import { reviewsApi } from "@/api/reviews";
import { providersApi } from "@/api/salons";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "@/hooks/useToast";
import type { Review } from "@/types";

export function ReviewsPage() {
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
  onToggle: (published: boolean) => void;
  isLoading: boolean;
}) {
  return (
    <Card className={review.is_published ? "" : "opacity-60"}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
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
        </div>
      </CardContent>
    </Card>
  );
}
