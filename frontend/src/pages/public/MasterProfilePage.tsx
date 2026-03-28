import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useRef } from "react";
import { professionalsApi } from "@/api/masters";
import { reviewsApi } from "@/api/reviews";
import { uploadsApi } from "@/api/uploads";
import { AppHeader } from "@/components/mobile/AppHeader";
import { MobileAvatar } from "@/components/mobile/MobileAvatar";
import { StarRating } from "@/components/mobile/StarRating";
import { useAuthContext } from "@/context/AuthContext";
import { toast } from "@/hooks/useToast";
import { Spinner } from "@/components/ui/spinner";
import { t } from "@/i18n";
import type { Review } from "@/types";

export function MasterProfilePage() {
  const { professionalId, masterId } = useParams<{ professionalId?: string; masterId?: string }>();
  const navigate = useNavigate();
  const id = Number(professionalId || masterId);
  const { role } = useAuthContext();
  const qc = useQueryClient();
  const [reviewOpen, setReviewOpen] = useState(false);

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

  const inviteMutation = useMutation({
    mutationFn: () => professionalsApi.sendInvite(id),
    onSuccess: () => toast({ title: t("professionals.invite_sent") }),
    onError: (e: { response?: { data?: { detail?: string } } }) =>
      toast({ title: t("professionals.invite_failed"), description: e?.response?.data?.detail, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <div className="max-w-[390px] mx-auto flex flex-col">
        <AppHeader variant="back-title" title={t("professionals.loading")} />
        <div className="p-ds-4 flex flex-col items-center gap-ds-4">
          <div className="w-[72px] h-[72px] rounded-ds-full bg-ds-bg-secondary animate-pulse" />
          <div className="h-6 w-32 bg-ds-bg-secondary rounded-ds-md animate-pulse" />
        </div>
      </div>
    );
  }

  if (!professional) {
    return (
      <div className="max-w-[390px] mx-auto flex flex-col items-center justify-center min-h-[300px] gap-ds-3 p-ds-6">
        <p className="ds-body text-ds-text-secondary">{t("professionals.not_found")}</p>
        <button onClick={() => navigate(-1)} className="ds-body-small text-ds-interactive">{t("professionals.go_back")}</button>
      </div>
    );
  }

  const activeProviders = professional.professional_providers?.filter((pp) => pp.status === "active") ?? [];

  return (
    <div className="max-w-[390px] mx-auto min-h-screen flex flex-col bg-ds-bg-secondary">
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
            {professional.experience_years != null && (
              <span className="ds-body-small text-ds-text-secondary">
                · {professional.experience_years}y exp
              </span>
            )}
          </div>
        </div>

        {stats && stats.total_reviews > 0 && (
          <div className="flex items-center gap-ds-2">
            <StarRating rating={stats.average_rating} size="sm" />
            <span className="ds-body-small text-ds-text-secondary">
              {stats.average_rating.toFixed(1)} {t("reviews.count", { count: stats.total_reviews })}
            </span>
          </div>
        )}

        {activeProviders.length > 0 && (
          <div className="flex flex-wrap gap-ds-2 justify-center">
            {activeProviders.map((pp) => (
              <button
                key={pp.id}
                onClick={() => navigate(`/providers/${pp.provider_id}`)}
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
          <p className="ds-h4 text-ds-text-primary mb-ds-2">{t("professionals.about")}</p>
          <p className="ds-body text-ds-text-secondary">{professional.bio}</p>
        </div>
      )}

      {/* CTA buttons */}
      <div className="px-ds-4 py-ds-4 bg-ds-bg-primary mt-ds-3 border-t border-ds-border flex flex-col gap-ds-3">
        {activeProviders.length > 0 ? (
          <button
            onClick={() => navigate(`/book/${activeProviders[0].provider_id}`)}
            className="w-full h-[48px] bg-ds-interactive rounded-ds-2xl ds-body-large text-ds-text-inverse"
          >
            {t("professionals.book_appointment")}
          </button>
        ) : (
          <button
            onClick={() => navigate("/")}
            className="w-full h-[48px] bg-ds-interactive rounded-ds-2xl ds-body-large text-ds-text-inverse"
          >
            {t("professionals.find_availability")}
          </button>
        )}
        <button
          onClick={() => setReviewOpen(true)}
          className="w-full h-[48px] border border-ds-border rounded-ds-2xl ds-body-large text-ds-text-primary"
        >
          {t("professionals.write_review")}
        </button>
        {role === "provider_owner" && (
          <button
            disabled={inviteMutation.isPending || inviteMutation.isSuccess}
            onClick={() => inviteMutation.mutate()}
            className="w-full h-[48px] border border-ds-border rounded-ds-2xl ds-body text-ds-text-secondary disabled:text-ds-text-disabled"
          >
            {inviteMutation.isSuccess ? t("professionals.invite_sent") : t("professionals.invite_to_work")}
          </button>
        )}
      </div>

      {/* Reviews */}
      <div className="bg-ds-bg-primary mt-ds-3 border-t border-ds-border pb-ds-4">
        <div className="px-ds-4 pt-ds-4 pb-ds-3 flex items-center justify-between">
          <p className="ds-h4 text-ds-text-primary">{t("professionals.reviews_section")}</p>
          {stats && stats.total_reviews > 0 && (
            <span className="ds-caption text-ds-text-secondary">
              {stats.average_rating.toFixed(1)} · {t("professionals.reviews_total", { count: stats.total_reviews })}
            </span>
          )}
        </div>
        {reviews.length === 0 ? (
          <p className="px-ds-4 ds-body text-ds-text-secondary">{t("professionals.no_reviews")}</p>
        ) : (
          <div className="flex flex-col">
            {reviews.map((review: Review, idx: number) => (
              <div
                key={review.id}
                className={`px-ds-4 py-ds-3 ${idx < reviews.length - 1 ? "border-b border-ds-border" : ""}`}
              >
                <div className="flex items-center justify-between mb-ds-1">
                  <p className="ds-body-strong text-ds-text-primary">{review.client_name}</p>
                  <span className="ds-caption text-ds-text-secondary">
                    {new Date(review.created_at).toLocaleDateString()}
                  </span>
                </div>
                <StarRating rating={review.rating} size="sm" />
                {review.comment && (
                  <p className="ds-body text-ds-text-secondary mt-ds-1">{review.comment}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Review modal */}
      {reviewOpen && (
        <ReviewModal
          professionalId={professional.id}
          providerId={professional.professional_providers?.[0]?.provider_id}
          professionalName={professional.name}
          onClose={() => setReviewOpen(false)}
          onSuccess={() => {
            setReviewOpen(false);
            qc.invalidateQueries({ queryKey: ["reviews", "professional", id] });
            qc.invalidateQueries({ queryKey: ["professional-stats", id] });
          }}
        />
      )}
    </div>
  );
}

function ReviewModal({
  professionalId,
  providerId,
  professionalName,
  onClose,
  onSuccess,
}: {
  professionalId: number;
  providerId?: number;
  professionalName: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [clientName, setClientName] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const submitMutation = useMutation({
    mutationFn: () =>
      reviewsApi.create({
        professional_id: professionalId,
        provider_id: providerId,
        client_name: clientName,
        rating,
        comment: comment || undefined,
        images: images.length > 0 ? images : undefined,
      }),
    onSuccess: () => {
      toast({ title: t("reviews.submitted") });
      onSuccess();
    },
    onError: (e: { response?: { data?: { detail?: string } } }) =>
      toast({ title: t("professionals.invite_failed"), description: e?.response?.data?.detail, variant: "destructive" }),
  });

  const handleFiles = async (files: FileList | null) => {
    if (!files) return;
    const remaining = 3 - images.length;
    if (remaining <= 0) return;
    setUploading(true);
    try {
      const urls = await uploadsApi.uploadImages(Array.from(files).slice(0, remaining), 1200);
      setImages((prev) => [...prev, ...urls].slice(0, 3));
    } catch {
      toast({ title: t("reviews.upload_failed"), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="bg-ds-bg-primary w-full max-w-[390px] rounded-t-ds-2xl">
        <div className="flex items-center justify-between px-ds-4 py-ds-4 border-b border-ds-border">
          <div>
            <p className="ds-h4 text-ds-text-primary">{t("reviews.write_title")}</p>
            <p className="ds-caption text-ds-text-secondary">{professionalName}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center text-ds-text-secondary">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M2 2L14 14M14 2L2 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="p-ds-4 flex flex-col gap-ds-4">
          {/* Star rating */}
          <div>
            <p className="ds-label text-ds-text-secondary mb-ds-2">{t("reviews.rating_label")}</p>
            <div className="flex gap-ds-2">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                >
                  <svg width="32" height="32" viewBox="0 0 16 16" fill="none">
                    <path
                      d="M8 1L9.854 5.854H15L10.573 8.646L12.427 13.5L8 10.708L3.573 13.5L5.427 8.646L1 5.854H6.146L8 1Z"
                      fill={s <= (hoverRating || rating) ? "var(--ds-feedback-rating)" : "var(--ds-border-strong)"}
                    />
                  </svg>
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="ds-label text-ds-text-secondary mb-ds-1">{t("reviews.name_label")}</p>
            <input
              placeholder={t("reviews.name_placeholder")}
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              className="w-full h-[44px] px-ds-3 bg-ds-bg-secondary border border-ds-border rounded-ds-xl ds-body text-ds-text-primary placeholder:text-ds-text-disabled outline-none focus:border-ds-interactive"
            />
          </div>

          <div>
            <p className="ds-label text-ds-text-secondary mb-ds-1">{t("reviews.comment_label")}</p>
            <textarea
              className="w-full px-ds-3 py-ds-2 bg-ds-bg-secondary border border-ds-border rounded-ds-xl ds-body text-ds-text-primary placeholder:text-ds-text-disabled outline-none focus:border-ds-interactive resize-none"
              rows={3}
              placeholder={t("reviews.comment_placeholder")}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          <div>
            <p className="ds-label text-ds-text-secondary mb-ds-2">{t("reviews.photos_label")}</p>
            <div className="flex gap-ds-2 flex-wrap">
              {images.map((url, i) => (
                <div key={i} className="relative">
                  <img src={url} alt="" className="h-[72px] w-[72px] object-cover rounded-ds-xl border border-ds-border" />
                  <button
                    onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute -top-1 -right-1 w-5 h-5 bg-ds-bg-primary border border-ds-border rounded-ds-full flex items-center justify-center"
                  >
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                      <path d="M1 1L9 9M9 1L1 9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              ))}
              {images.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="h-[72px] w-[72px] border border-dashed border-ds-border rounded-ds-xl flex flex-col items-center justify-center gap-[4px] text-ds-text-disabled"
                >
                  {uploading ? <Spinner size="sm" /> : (
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 4V16M4 10H16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                  <span className="ds-caption">{t("reviews.add_photo")}</span>
                </button>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
          </div>
        </div>

        <div className="flex gap-ds-3 px-ds-4 pb-ds-6 pt-ds-2 border-t border-ds-border">
          <button
            onClick={onClose}
            className="flex-1 h-[48px] border border-ds-border rounded-ds-2xl ds-body text-ds-text-primary"
          >
            {t("reviews.cancel")}
          </button>
          <button
            disabled={!clientName.trim() || rating === 0 || submitMutation.isPending}
            onClick={() => submitMutation.mutate()}
            className="flex-1 h-[48px] bg-ds-interactive rounded-ds-2xl ds-body text-ds-text-inverse disabled:bg-ds-bg-secondary disabled:text-ds-text-disabled"
          >
            {submitMutation.isPending ? t("reviews.submitting") : t("reviews.submit")}
          </button>
        </div>
      </div>
    </div>
  );
}
