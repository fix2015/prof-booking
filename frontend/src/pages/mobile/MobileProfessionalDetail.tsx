import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { professionalsApi } from "@/api/masters";
import { reviewsApi } from "@/api/reviews";
import { AppHeader } from "@/components/mobile/AppHeader";
import { MobileAvatar } from "@/components/mobile/MobileAvatar";
import { StarRating } from "@/components/mobile/StarRating";

export function MobileProfessionalDetail() {
  const { professionalId } = useParams<{ professionalId: string }>();
  const navigate = useNavigate();
  const id = Number(professionalId);

  const { data: professional, isLoading } = useQuery({
    queryKey: ["professional", id],
    queryFn: () => professionalsApi.getById(id),
    enabled: !!id,
  });

  const { data: stats } = useQuery({
    queryKey: ["professional-stats", id],
    queryFn: () => reviewsApi.masterStats(id).then((r) => r.data),
    enabled: !!id,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", "professional", id],
    queryFn: () => reviewsApi.list({ professional_id: id }).then((r) => r.data),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex flex-col">
        <AppHeader variant="back-title" title="Loading..." />
        <div className="p-ds-4 flex flex-col items-center gap-ds-4">
          <div className="w-[72px] h-[72px] rounded-ds-full bg-ds-bg-secondary animate-pulse" />
          <div className="h-6 w-32 bg-ds-bg-secondary rounded-ds-md animate-pulse" />
          <div className="h-20 w-full bg-ds-bg-secondary rounded-ds-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[300px] gap-ds-3 p-ds-6">
        <p className="ds-body text-ds-text-secondary">Professional not found</p>
        <button onClick={() => navigate(-1)} className="ds-body-small text-ds-interactive">
          Go back
        </button>
      </div>
    );
  }

  const providers = professional.professional_providers?.filter((pp) => pp.status === "active") ?? [];

  return (
    <div className="flex flex-col bg-ds-bg-secondary">
      <AppHeader variant="back-title" title={professional.name} />

      {/* Profile header */}
      <div className="bg-ds-bg-primary px-ds-4 pt-ds-6 pb-ds-4 flex flex-col items-center gap-ds-3 border-b border-ds-border">
        <MobileAvatar name={professional.name} size="xl" imageUrl={professional.avatar_url ?? undefined} />
        <div className="text-center">
          <h1 className="ds-h1 text-ds-text-primary">{professional.name}</h1>
          <div className="flex items-center justify-center gap-ds-2 mt-ds-1">
            {professional.nationality && (
              <span className="ds-body-small text-ds-text-secondary">{professional.nationality}</span>
            )}
            {professional.experience_years && (
              <span className="ds-body-small text-ds-text-secondary">
                · {professional.experience_years}y exp
              </span>
            )}
          </div>
        </div>

        {stats && (
          <div className="flex items-center gap-ds-2 mt-ds-1">
            <StarRating rating={stats.average_rating} size="sm" />
            <span className="ds-body-small text-ds-text-secondary">
              {stats.average_rating.toFixed(1)} ({stats.total_reviews} reviews)
            </span>
          </div>
        )}

        {/* Works at */}
        {providers.length > 0 && (
          <div className="flex flex-wrap gap-ds-2 justify-center">
            {providers.map((pp) => (
              <button
                key={pp.id}
                onClick={() => pp.provider_id && navigate(`/providers/${pp.provider_id}`)}
                className="bg-ds-bg-secondary rounded-ds-full px-ds-3 py-[4px] ds-caption text-ds-text-secondary border border-ds-border"
              >
                {pp.provider?.name ?? "Provider"}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Bio */}
      {professional.bio && (
        <div className="bg-ds-bg-primary mt-ds-3 px-ds-4 py-ds-4 border-t border-ds-border">
          <p className="ds-h4 text-ds-text-primary mb-ds-2">About</p>
          <p className="ds-body text-ds-text-secondary">{professional.bio}</p>
        </div>
      )}

      {/* CTA buttons */}
      <div className="px-ds-4 py-ds-4 bg-ds-bg-primary mt-ds-3 border-t border-ds-border flex flex-col gap-ds-3">
        {providers.length > 0 ? (
          <button
            onClick={() => navigate(`/book/${providers[0].provider_id}`)}
            className="w-full h-[48px] bg-ds-interactive rounded-ds-2xl ds-body-large text-ds-text-inverse"
          >
            Book Appointment
          </button>
        ) : (
          <button
            onClick={() => navigate("/")}
            className="w-full h-[48px] bg-ds-interactive rounded-ds-2xl ds-body-large text-ds-text-inverse"
          >
            Find Availability
          </button>
        )}
        <button className="w-full h-[48px] border border-ds-border rounded-ds-2xl ds-body-large text-ds-text-primary">
          Write a Review
        </button>
      </div>

      {/* Reviews */}
      <div className="bg-ds-bg-primary mt-ds-3 border-t border-ds-border pb-ds-4">
        <div className="px-ds-4 pt-ds-4 pb-ds-3">
          <p className="ds-h4 text-ds-text-primary">Reviews</p>
        </div>
        {reviews.length === 0 ? (
          <div className="px-ds-4">
            <p className="ds-body text-ds-text-secondary">No reviews yet.</p>
          </div>
        ) : (
          <div className="flex flex-col">
            {reviews.map((review, idx) => (
              <div
                key={review.id}
                className={`px-ds-4 py-ds-3 ${idx < reviews.length - 1 ? "border-b border-ds-border" : ""}`}
              >
                <div className="flex items-center gap-ds-2 mb-ds-1">
                  <StarRating rating={review.rating} size="sm" />
                  <span className="ds-caption text-ds-text-secondary">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                {review.comment && (
                  <p className="ds-body text-ds-text-primary">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
