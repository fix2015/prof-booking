import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Star, Clock, Flag, Image } from "lucide-react";
import { professionalsApi } from "@/api/masters";
import { reviewsApi } from "@/api/reviews";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import type { Review } from "@/types";

export function MasterProfilePage() {
  // Support both new (/professionals/:professionalId) and old (/masters/:masterId) routes
  const { professionalId, masterId } = useParams<{ professionalId?: string; masterId?: string }>();
  const id = Number(professionalId || masterId);

  const { data: professional, isLoading } = useQuery({
    queryKey: ["professional", id],
    queryFn: () => professionalsApi.getById(id),
    enabled: !!id,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", "professional", id],
    queryFn: () => reviewsApi.list({ master_id: id }).then((r) => r.data),
    enabled: !!id,
  });

  const { data: stats } = useQuery({
    queryKey: ["review-stats", id],
    queryFn: () => reviewsApi.masterStats(id).then((r) => r.data),
    enabled: !!id,
  });

  const { data: photos = [] } = useQuery({
    queryKey: ["professional-photos", id],
    queryFn: () => professionalsApi.getPhotos(id),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner />
      </div>
    );
  }

  if (!professional) {
    return <p className="text-center py-20 text-muted-foreground">Professional not found.</p>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 md:space-y-8 py-4 md:py-6">
      {/* Hero */}
      <div className="flex flex-col sm:flex-row gap-4 md:gap-6 items-start">
        <div className="flex-shrink-0">
          {professional.avatar_url ? (
            <img
              src={professional.avatar_url}
              alt={professional.name}
              className="h-24 w-24 md:h-32 md:w-32 rounded-full object-cover border-4 border-white shadow-lg"
            />
          ) : (
            <div className="h-24 w-24 md:h-32 md:w-32 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-3xl md:text-4xl font-bold text-white shadow-lg">
              {professional.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h1 className="text-2xl md:text-3xl font-bold">{professional.name}</h1>

          <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
            {professional.nationality && (
              <span className="flex items-center gap-1">
                <Flag className="h-4 w-4" />
                {professional.nationality}
              </span>
            )}
            {professional.experience_years !== undefined && professional.experience_years !== null && (
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                {professional.experience_years} {professional.experience_years === 1 ? "year" : "years"} experience
              </span>
            )}
            {stats && stats.total_reviews > 0 && (
              <span className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {stats.average_rating.toFixed(1)} ({stats.total_reviews} reviews)
              </span>
            )}
          </div>

          {professional.bio && <p className="mt-3 text-muted-foreground">{professional.bio}</p>}
          {professional.description && (
            <p className="mt-2 text-sm leading-relaxed">{professional.description}</p>
          )}

          <div className="mt-4">
            <Link to={`/book?professional_id=${professional.id}`}>
              <Button size="lg" className="bg-pink-600 hover:bg-pink-700">
                Book Appointment
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Photo Gallery */}
      {photos.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Image className="h-5 w-5" /> Portfolio
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
            {photos.map((photo) => (
              <div key={photo.id} className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                <img
                  src={photo.image_url}
                  alt={photo.caption ?? "Portfolio photo"}
                  className="h-full w-full object-cover hover:scale-105 transition-transform duration-200"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <Star className="h-5 w-5" /> Reviews
          {stats && stats.total_reviews > 0 && (
            <span className="text-base font-normal text-muted-foreground">
              ({stats.average_rating.toFixed(1)} ★ · {stats.total_reviews} total)
            </span>
          )}
        </h2>

        {/* Rating distribution */}
        {stats && stats.total_reviews > 0 && (
          <Card className="mb-4">
            <CardContent className="p-4">
              <div className="space-y-1">
                {[5, 4, 3, 2, 1].map((star) => {
                  const count = stats.rating_distribution[String(star)] ?? 0;
                  const pct = stats.total_reviews > 0 ? (count / stats.total_reviews) * 100 : 0;
                  return (
                    <div key={star} className="flex items-center gap-2 text-sm">
                      <span className="w-4">{star}</span>
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-6 text-right text-muted-foreground">{count}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {reviews.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center">No reviews yet.</p>
        ) : (
          <div className="space-y-3">
            {reviews.map((review: Review) => (
              <ReviewCard key={review.id} review={review} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-medium">{review.client_name}</p>
            <p className="text-xs text-muted-foreground">
              {new Date(review.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-0.5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={`h-4 w-4 ${i < review.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-200"}`}
              />
            ))}
          </div>
        </div>
        {review.comment && <p className="text-sm text-muted-foreground">{review.comment}</p>}
      </CardContent>
    </Card>
  );
}
