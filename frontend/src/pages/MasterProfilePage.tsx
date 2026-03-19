import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Clock, Flag, Image, CheckCircle2, Calendar, TrendingUp, Building2, UserPlus, MessageSquare, X, Upload } from "lucide-react";
import { useState, useRef } from "react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

import { professionalsApi } from "@/api/masters";
import { reviewsApi } from "@/api/reviews";
import { uploadsApi } from "@/api/uploads";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthContext } from "@/context/AuthContext";
import { toast } from "@/hooks/useToast";
import type { Review } from "@/types";

export function MasterProfilePage() {
  // Support both new (/professionals/:professionalId) and old (/masters/:masterId) routes
  const { professionalId, masterId } = useParams<{ professionalId?: string; masterId?: string }>();
  const id = Number(professionalId || masterId);
  const { role } = useAuthContext();
  const qc = useQueryClient();
  const [reviewOpen, setReviewOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(-1);

  const { data: professional, isLoading } = useQuery({
    queryKey: ["professional", id],
    queryFn: () => professionalsApi.getById(id),
    enabled: !!id,
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ["reviews", "professional", id],
    queryFn: () => reviewsApi.list({ professional_id: id }).then((r) => r.data),
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

  const { data: profStats } = useQuery({
    queryKey: ["professional-stats", id],
    queryFn: () => professionalsApi.getStats(id),
    enabled: !!id,
  });

  const inviteMutation = useMutation({
    mutationFn: () => professionalsApi.sendInvite(id),
    onSuccess: () => toast({ title: "Invite sent!", description: "The professional will be notified." }),
    onError: (e: any) => toast({
      title: "Failed to send invite",
      description: e?.response?.data?.detail ?? "Something went wrong.",
      variant: "destructive",
    }),
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
            <div className="h-24 w-24 md:h-32 md:w-32 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-3xl md:text-4xl font-bold text-white shadow-lg">
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

          {/* Linked providers */}
          {(professional.professional_providers ?? []).length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {professional.professional_providers!.map((pp) => (
                <Link
                  key={pp.id}
                  to={`/providers/${pp.provider_id}`}
                  className="flex items-center gap-1.5 text-xs bg-pink-50 border border-pink-200 text-pink-700 rounded-full px-3 py-1 hover:bg-pink-100 transition-colors"
                >
                  <Building2 className="h-3 w-3" />
                  {pp.provider?.name ?? `Provider #${pp.provider_id}`}
                </Link>
              ))}
            </div>
          )}

          <div className="mt-4 flex flex-col sm:flex-row flex-wrap gap-2">
            <Link to={`/book?professional_id=${professional.id}`} className="w-full sm:w-auto">
              <Button size="sm" className="w-full sm:w-auto sm:text-base sm:px-5 sm:py-2.5 bg-gray-900 hover:bg-gray-950">
                Book Appointment
              </Button>
            </Link>
            {role === "provider_owner" && (
              <Button
                size="sm"
                variant="outline"
                className="w-full sm:w-auto sm:text-base sm:px-5 sm:py-2.5 gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
                disabled={inviteMutation.isPending || inviteMutation.isSuccess}
                onClick={() => inviteMutation.mutate()}
              >
                <UserPlus className="h-4 w-4" />
                {inviteMutation.isSuccess ? "Invite Sent" : "Invite to Work"}
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              className="w-full sm:w-auto sm:text-base sm:px-5 sm:py-2.5 gap-2"
              onClick={() => setReviewOpen(true)}
            >
              <MessageSquare className="h-4 w-4" />
              Write a Review
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      {profStats && (
        <div className="grid grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-1"><Calendar className="h-5 w-5 text-blue-500" /></div>
              <p className="text-2xl font-bold">{profStats.today_sessions}</p>
              <p className="text-xs text-muted-foreground">Today</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-1"><TrendingUp className="h-5 w-5 text-purple-500" /></div>
              <p className="text-2xl font-bold">{profStats.week_sessions}</p>
              <p className="text-xs text-muted-foreground">This Week</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex justify-center mb-1"><CheckCircle2 className="h-5 w-5 text-green-500" /></div>
              <p className="text-2xl font-bold">{profStats.completed_sessions}</p>
              <p className="text-xs text-muted-foreground">Completed</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Photo Gallery */}
      {photos.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Image className="h-5 w-5" /> Portfolio
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-3">
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                type="button"
                className="aspect-square overflow-hidden rounded-lg bg-gray-100 cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-gray-400"
                onClick={() => setLightboxIndex(i)}
              >
                <img
                  src={photo.image_url}
                  alt={photo.caption ?? "Portfolio photo"}
                  className="h-full w-full object-cover hover:scale-105 transition-transform duration-200"
                />
              </button>
            ))}
          </div>

          <Lightbox
            open={lightboxIndex >= 0}
            index={lightboxIndex}
            close={() => setLightboxIndex(-1)}
            slides={photos.map((p) => ({ src: p.image_url, alt: p.caption ?? "" }))}
          />
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
            qc.invalidateQueries({ queryKey: ["review-stats", id] });
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
      toast({ title: "Review submitted! Thank you." });
      onSuccess();
    },
    onError: (e: any) =>
      toast({
        title: "Failed to submit review",
        description: e?.response?.data?.detail ?? "Please try again.",
        variant: "destructive",
      }),
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
      toast({ title: "Image upload failed", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="font-bold text-lg">Write a Review</h2>
            <p className="text-xs text-muted-foreground">{professionalName}</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full">
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Star rating */}
          <div>
            <label className="text-sm font-medium mb-1 block">Rating *</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button
                  key={s}
                  type="button"
                  onMouseEnter={() => setHoverRating(s)}
                  onMouseLeave={() => setHoverRating(0)}
                  onClick={() => setRating(s)}
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      s <= (hoverRating || rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-sm font-medium mb-1 block">Your name *</label>
            <Input
              placeholder="Jane Doe"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
            />
          </div>

          {/* Comment */}
          <div>
            <label className="text-sm font-medium mb-1 block">Comment</label>
            <textarea
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              rows={3}
              placeholder="Share your experience…"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
            />
          </div>

          {/* Images */}
          <div>
            <label className="text-sm font-medium mb-1 block">
              Photos (up to 3)
            </label>
            <div className="flex gap-2 flex-wrap">
              {images.map((url, i) => (
                <div key={i} className="relative">
                  <img src={url} alt="" className="h-20 w-20 object-cover rounded-lg border" />
                  <button
                    onClick={() => setImages((prev) => prev.filter((_, j) => j !== i))}
                    className="absolute -top-1.5 -right-1.5 bg-white border rounded-full p-0.5 shadow"
                  >
                    <X className="h-3 w-3 text-gray-600" />
                  </button>
                </div>
              ))}
              {images.length < 3 && (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="h-20 w-20 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center text-gray-400 hover:border-gray-400 transition-colors"
                >
                  {uploading ? (
                    <Spinner size="sm" />
                  ) : (
                    <>
                      <Upload className="h-5 w-5 mb-1" />
                      <span className="text-xs">Add photo</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFiles(e.target.files)}
            />
          </div>
        </div>

        <div className="flex gap-2 p-5 border-t">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1 bg-gray-900 hover:bg-gray-950"
            disabled={!clientName.trim() || rating === 0 || submitMutation.isPending}
            onClick={() => submitMutation.mutate()}
          >
            {submitMutation.isPending ? "Submitting…" : "Submit Review"}
          </Button>
        </div>
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
        {(review as any).images?.length > 0 && (
          <div className="mt-2 flex gap-2 flex-wrap">
            {(review as any).images.map((url: string, i: number) => (
              <img key={i} src={url} alt="" className="h-16 w-16 object-cover rounded-lg border" />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
