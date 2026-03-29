import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { usePublicProvider } from "@/hooks/useSalon";
import { useProviderProfessionalsPublic } from "@/hooks/useMaster";
import { servicesApi } from "@/api/services";
import { reviewsApi } from "@/api/reviews";
import { useAuthContext } from "@/context/AuthContext";
import { useGuestSession } from "@/hooks/useGuestSession";
import { AppHeader } from "@/components/mobile/AppHeader";
import { MobileAvatar } from "@/components/mobile/MobileAvatar";
import { t } from "@/i18n";
import type { Review } from "@/types";

const SAVED_KEY = "pb_saved";

function getSaved(): number[] {
  try {
    return JSON.parse(localStorage.getItem(SAVED_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function toggleSaved(id: number): number[] {
  const current = getSaved();
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  localStorage.setItem(SAVED_KEY, JSON.stringify(next));
  return next;
}

function StarPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-[4px]">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type="button" onClick={() => onChange(n)} className="p-[2px]">
          <svg width="28" height="28" viewBox="0 0 14 14" fill="none">
            <path
              d="M7 1l1.5 3.2L12 4.8l-2.5 2.4.6 3.4L7 9.1 3.9 10.6l.6-3.4L2 4.8l3.5-.6L7 1Z"
              fill={n <= value ? "var(--ds-feedback-saved)" : "none"}
              stroke={n <= value ? "var(--ds-feedback-saved)" : "var(--ds-border-strong)"}
              strokeWidth="1"
            />
          </svg>
        </button>
      ))}
    </div>
  );
}

function ReviewCard({ review }: { review: Review }) {
  return (
    <div className="px-ds-4 py-ds-3 border-b border-ds-border last:border-b-0">
      <div className="flex items-center justify-between gap-ds-2 mb-[4px]">
        <div className="flex gap-[2px]">
          {[1, 2, 3, 4, 5].map((n) => (
            <svg key={n} width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path
                d="M7 1l1.5 3.2L12 4.8l-2.5 2.4.6 3.4L7 9.1 3.9 10.6l.6-3.4L2 4.8l3.5-.6L7 1Z"
                fill={n <= review.rating ? "var(--ds-feedback-saved)" : "none"}
                stroke={n <= review.rating ? "var(--ds-feedback-saved)" : "var(--ds-border-strong)"}
                strokeWidth="1"
              />
            </svg>
          ))}
        </div>
        <span className="ds-caption text-ds-text-muted">
          {new Date(review.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </span>
      </div>
      <p className="ds-caption text-ds-text-secondary font-medium">{review.client_name}</p>
      {review.comment && <p className="ds-body text-ds-text-secondary mt-[2px]">{review.comment}</p>}
    </div>
  );
}

export function ProviderProfilePage() {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  const id = Number(providerId);
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuthContext();
  const { guestProfile } = useGuestSession();

  const { data: provider, isLoading } = usePublicProvider(id);
  const { data: professionals = [] } = useProviderProfessionalsPublic(id);
  const { data: services = [] } = useQuery({
    queryKey: ["services", "provider", id],
    queryFn: () => servicesApi.listByProvider(id),
    enabled: !!id,
  });
  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", "provider", id],
    queryFn: () => reviewsApi.list({ provider_id: id }).then((r) => r.data),
    enabled: !!id,
  });

  const [saved, setSaved] = useState<number[]>(getSaved);
  const [showAllServices, setShowAllServices] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewName, setReviewName] = useState(
    isAuthenticated && user ? (user.name || user.email.split("@")[0]) : (guestProfile?.name ?? "")
  );
  const [reviewPhone, setReviewPhone] = useState(
    isAuthenticated && user?.phone ? user.phone : (guestProfile?.phone ?? "")
  );
  const [reviewProfessionalId, setReviewProfessionalId] = useState<number | "">("");
  const [reviewComment, setReviewComment] = useState("");
  const [reviewDone, setReviewDone] = useState(false);

  const submitReview = useMutation({
    mutationFn: () => reviewsApi.create({
      professional_id: reviewProfessionalId !== "" ? Number(reviewProfessionalId) : (professionals[0]?.id ?? 0),
      provider_id: id,
      client_name: reviewName.trim(),
      client_phone: reviewPhone.trim(),
      rating: reviewRating,
      comment: reviewComment.trim() || undefined,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reviews", "provider", id] });
      setReviewDone(true);
      setTimeout(() => {
        setShowReviewForm(false);
        setReviewDone(false);
        setReviewComment("");
        setReviewRating(5);
      }, 1500);
    },
  });

  const isSaved = provider ? saved.includes(provider.id) : false;

  const HeartButton = (
    <button
      onClick={() => provider && setSaved(toggleSaved(provider.id))}
      className="w-8 h-8 flex items-center justify-center"
      aria-label={isSaved ? "Unsave" : "Save"}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill={isSaved ? "var(--ds-feedback-saved)" : "none"}>
        <path
          d="M10 17.5L2 9.5C1 8.5 0.5 7 0.5 6C0.5 3.5 2.5 1.5 5 1.5C6.5 1.5 7.8 2.2 9 3.5L10 4.5L11 3.5C12.2 2.2 13.5 1.5 15 1.5C17.5 1.5 19.5 3.5 19.5 6C19.5 7 19 8.5 18 9.5L10 17.5Z"
          stroke={isSaved ? "var(--ds-feedback-saved)" : "var(--ds-border-strong)"}
          strokeWidth="1.5"
        />
      </svg>
    </button>
  );

  if (isLoading) {
    return (
      <div className="max-w-[768px] mx-auto min-h-screen bg-ds-bg-secondary flex flex-col">
        <AppHeader variant="back-title" title={t("providers.loading")} />
        <div className="h-[140px] bg-ds-bg-secondary animate-pulse" />
        <div className="p-ds-4 flex flex-col gap-ds-3">
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className="h-12 bg-ds-bg-secondary rounded-ds-xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="max-w-[768px] mx-auto flex flex-col items-center justify-center min-h-[300px] gap-ds-3 p-ds-6">
        <p className="ds-body text-ds-text-secondary">{t("providers.not_found")}</p>
        <button onClick={() => navigate("/")} className="ds-body-small text-ds-interactive">
          {t("providers.back_to_discovery")}
        </button>
      </div>
    );
  }

  const displayedServices = showAllServices ? services : services.slice(0, 4);

  return (
    <div className="max-w-[768px] mx-auto min-h-screen flex flex-col bg-ds-bg-secondary">
      <AppHeader variant="back-title-action" title={provider.name} rightElement={HeartButton} />

      {/* Hero banner */}
      <div className="h-[140px] bg-ds-avatar-teal flex items-center justify-center relative overflow-hidden">
        {provider.logo_url ? (
          <img src={provider.logo_url} alt={provider.name} className="w-full h-full object-cover" />
        ) : null}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-ds-2">
          <MobileAvatar name={provider.name} size="xl" color="teal" imageUrl={provider.logo_url ?? undefined} />
        </div>
      </div>

      {/* Provider info */}
      <div className="bg-ds-bg-primary px-ds-4 pt-ds-4 pb-ds-4 flex flex-col items-center gap-ds-2 border-b border-ds-border">
        <h1 className="ds-h1 text-ds-text-primary text-center">{provider.name}</h1>
        {provider.category && (
          <span className="bg-ds-bg-secondary rounded-ds-full px-ds-3 py-[2px] ds-caption text-ds-text-secondary">
            {provider.category}
          </span>
        )}
        {provider.address && (
          <p className="ds-body-small text-ds-text-secondary text-center">{provider.address}</p>
        )}

        {/* Stats */}
        <div className="flex gap-ds-6 mt-ds-2">
          <div className="text-center">
            <p className="ds-h2 text-ds-text-primary">{services.length}</p>
            <p className="ds-caption text-ds-text-secondary">{t("providers.services_label")}</p>
          </div>
          <div className="w-px bg-ds-border" />
          <div className="text-center">
            <p className="ds-h2 text-ds-text-primary">{professionals.length}</p>
            <p className="ds-caption text-ds-text-secondary">{t("providers.professionals_label")}</p>
          </div>
        </div>
      </div>

      {/* Book CTA */}
      <div className="px-ds-4 py-ds-4 bg-ds-bg-primary border-b border-ds-border">
        <button
          onClick={() => navigate(`/book/${provider.id}`)}
          className="w-full h-[48px] bg-ds-interactive rounded-ds-2xl ds-body-large text-ds-text-inverse"
        >
          {t("providers.book_appointment")}
        </button>
      </div>

      {/* Services */}
      {services.length > 0 && (
        <div className="bg-ds-bg-primary mt-ds-3 border-t border-ds-border">
          <div className="px-ds-4 pt-ds-4 pb-ds-2">
            <p className="ds-h4 text-ds-text-primary">{t("providers.services_section")}</p>
          </div>
          <div>
            {displayedServices.map((service, idx) => (
              <button
                key={service.id}
                type="button"
                onClick={() => navigate(`/book/${provider.id}?service_id=${service.id}`)}
                className={`w-full flex items-center px-ds-4 py-ds-3 text-left active:bg-ds-bg-secondary ${
                  idx < displayedServices.length - 1 ? "border-b border-ds-border" : ""
                }`}
              >
                <div className="flex-1">
                  <p className="ds-body text-ds-text-primary">{service.name}</p>
                  <p className="ds-caption text-ds-text-secondary">{t("providers.duration_min", { min: service.duration_minutes })}</p>
                </div>
                <div className="flex items-center gap-ds-2">
                  <p className="ds-body-strong text-ds-text-primary">${service.price}</p>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-ds-text-muted">
                    <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </button>
            ))}
          </div>
          {services.length > 4 && (
            <button
              onClick={() => setShowAllServices((v) => !v)}
              className="w-full py-ds-3 ds-body-small text-ds-interactive border-t border-ds-border"
            >
              {showAllServices ? t("providers.show_less") : t("providers.show_all", { count: services.length })}
            </button>
          )}
        </div>
      )}

      {/* Professionals */}
      {professionals.length > 0 && (
        <div className="bg-ds-bg-primary mt-ds-3 border-t border-ds-border pb-ds-4">
          <div className="px-ds-4 pt-ds-4 pb-ds-3">
            <p className="ds-h4 text-ds-text-primary">{t("providers.our_team")}</p>
          </div>
          <div className="flex gap-ds-4 px-ds-4 overflow-x-auto scrollbar-none">
            {professionals.map((pro) => (
              <button
                key={pro.id}
                onClick={() => navigate(`/professionals/${pro.id}`)}
                className="flex flex-col items-center gap-ds-2 flex-shrink-0 w-[72px]"
              >
                <MobileAvatar name={pro.name} size="lg" imageUrl={pro.avatar_url ?? undefined} />
                <p className="ds-body-strong text-ds-text-primary text-center leading-tight">{pro.name}</p>
                {pro.experience_years && (
                  <p className="ds-caption text-ds-text-secondary">{pro.experience_years}y exp</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Reviews */}
      <div className="bg-ds-bg-primary mt-ds-3 border-t border-ds-border mb-ds-4">
        <div className="px-ds-4 pt-ds-4 pb-ds-3 flex items-center justify-between">
          <p className="ds-h4 text-ds-text-primary">
            {t("reviews.title")} {reviews.length > 0 && <span className="ds-caption text-ds-text-muted">({reviews.length})</span>}
          </p>
          <button
            onClick={() => setShowReviewForm(true)}
            className="h-[32px] px-ds-3 bg-ds-interactive rounded-ds-full ds-caption text-ds-text-inverse font-semibold"
          >
            {t("reviews.write_review")}
          </button>
        </div>
        {reviews.length === 0 ? (
          <p className="ds-body text-ds-text-secondary px-ds-4 pb-ds-4">{t("reviews.be_first")}</p>
        ) : (
          reviews.slice(0, 5).map((r) => <ReviewCard key={r.id} review={r} />)
        )}
      </div>

      {/* Write Review Sheet */}
      {showReviewForm && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40" onClick={() => setShowReviewForm(false)}>
          <div
            className="bg-ds-bg-primary rounded-t-[20px] px-ds-4 pt-ds-4 pb-[32px] flex flex-col gap-ds-3 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <p className="ds-h4 text-ds-text-primary">{t("reviews.write_review")}</p>
              <button onClick={() => setShowReviewForm(false)} className="text-ds-text-muted p-[4px]">✕</button>
            </div>

            {reviewDone ? (
              <div className="py-ds-6 flex flex-col items-center gap-ds-2">
                <span className="text-[32px]">🎉</span>
                <p className="ds-body-strong text-ds-text-primary">{t("reviews.success")}</p>
              </div>
            ) : (
              <>
                {/* Star rating */}
                <div className="flex flex-col gap-[6px]">
                  <p className="ds-label text-ds-text-secondary">{t("reviews.rating_label")}</p>
                  <StarPicker value={reviewRating} onChange={setReviewRating} />
                </div>

                {/* Name */}
                <div className="flex flex-col gap-[4px]">
                  <label className="ds-label text-ds-text-secondary">{t("reviews.your_name")}</label>
                  <input
                    className="h-[44px] border border-ds-border rounded-ds-lg px-ds-3 ds-body text-ds-text-primary bg-ds-bg-primary outline-none focus:border-ds-interactive"
                    value={reviewName}
                    onChange={(e) => setReviewName(e.target.value)}
                    placeholder={t("reviews.your_name")}
                  />
                </div>

                {/* Phone — required, private */}
                <div className="flex flex-col gap-[4px]">
                  <label className="ds-label text-ds-text-secondary">
                    {t("reviews.your_phone")}
                    <span className="ml-[6px] ds-caption text-ds-text-muted">{t("reviews.phone_hint")}</span>
                  </label>
                  <input
                    className="h-[44px] border border-ds-border rounded-ds-lg px-ds-3 ds-body text-ds-text-primary bg-ds-bg-primary outline-none focus:border-ds-interactive"
                    value={reviewPhone}
                    onChange={(e) => setReviewPhone(e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    type="tel"
                  />
                </div>

                {/* Professional picker (only if multiple) */}
                {professionals.length > 1 && (
                  <div className="flex flex-col gap-[4px]">
                    <label className="ds-label text-ds-text-secondary">{t("reviews.professional_label")}</label>
                    <select
                      className="h-[44px] border border-ds-border rounded-ds-lg px-ds-3 ds-body text-ds-text-primary bg-ds-bg-primary outline-none focus:border-ds-interactive"
                      value={reviewProfessionalId}
                      onChange={(e) => setReviewProfessionalId(e.target.value === "" ? "" : Number(e.target.value))}
                    >
                      <option value="">— select —</option>
                      {professionals.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Comment */}
                <div className="flex flex-col gap-[4px]">
                  <label className="ds-label text-ds-text-secondary">{t("reviews.comment_label")}</label>
                  <textarea
                    className="border border-ds-border rounded-ds-lg px-ds-3 py-ds-2 ds-body text-ds-text-primary bg-ds-bg-primary outline-none focus:border-ds-interactive resize-none"
                    rows={3}
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder={t("reviews.comment_placeholder")}
                  />
                </div>

                <button
                  type="button"
                  onClick={() => submitReview.mutate()}
                  disabled={
                    !reviewName.trim() ||
                    !reviewPhone.trim() ||
                    (professionals.length > 1 && reviewProfessionalId === "") ||
                    submitReview.isPending
                  }
                  className="h-[48px] bg-ds-interactive rounded-ds-2xl ds-body-large text-ds-text-inverse disabled:opacity-50"
                >
                  {submitReview.isPending ? t("reviews.submitting") : t("reviews.submit")}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
