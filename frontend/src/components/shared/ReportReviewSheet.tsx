import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { isAxiosError } from "axios";
import { X } from "lucide-react";
import { reviewsApi, type ReviewReportReason } from "@/api/reviews";
import { useAuthContext } from "@/context/AuthContext";
import { toast } from "@/hooks/useToast";
import { t, type TranslationKey } from "@/i18n";
import type { Review } from "@/types";

const REPORT_REASONS: { value: ReviewReportReason; labelKey: TranslationKey }[] = [
  { value: "spam", labelKey: "review.report.reason.spam" },
  { value: "inappropriate", labelKey: "review.report.reason.inappropriate" },
  { value: "harassment", labelKey: "review.report.reason.harassment" },
  { value: "other", labelKey: "review.report.reason.other" },
];

interface Props {
  review: Review;
  onClose: () => void;
  /** Called after the report was accepted (or had already been filed by this user). */
  onReported?: (review: Review) => void;
}

const pillActive = "bg-ds-interactive rounded-ds-full px-ds-4 py-ds-2 ds-label text-ds-text-inverse text-left";
const pillInactive =
  "bg-ds-bg-primary border border-ds-border rounded-ds-full px-ds-4 py-ds-2 ds-label text-ds-text-secondary text-left";

/** Bottom sheet to report a review (App Store guideline 1.2): four reasons, optional note, Submit → toast. */
export function ReportReviewSheet({ review, onClose, onReported }: Props) {
  const { isAuthenticated } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [reason, setReason] = useState<ReviewReportReason | null>(null);
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);

  async function submit() {
    if (!reason) return;
    setSending(true);
    try {
      await reviewsApi.report(review.id, reason, note.trim() || undefined);
      toast({ title: t("review.report.success"), variant: "success" });
      onReported?.(review);
      onClose();
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 409) {
        toast({ title: t("review.report.duplicate") });
        onReported?.(review);
        onClose();
      } else {
        toast({ title: t("review.report.failed"), variant: "destructive" });
      }
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="report-review-title">
      <div className="absolute inset-0 bg-ds-bg-inverse opacity-40" onClick={onClose} />
      <div className="absolute bottom-0 left-0 right-0 mx-auto max-w-[768px] bg-ds-bg-primary rounded-t-ds-2xl flex flex-col gap-ds-4 px-ds-5 pt-ds-2 max-h-[90vh] overflow-y-auto pb-[max(env(safe-area-inset-bottom),24px)]">
        <div className="flex justify-center pt-ds-1">
          <div className="w-ds-10 h-ds-1 bg-ds-border-strong rounded-ds-full" />
        </div>
        <div className="flex justify-between items-center">
          <h2 id="report-review-title" className="ds-h3 text-ds-text-primary">{t("review.report.title")}</h2>
          <button type="button" onClick={onClose} aria-label={t("review.report.close")} className="p-ds-1 text-ds-text-muted">
            <X className="h-5 w-5" aria-hidden />
          </button>
        </div>
        <div className="h-px bg-ds-border w-full" />

        {!isAuthenticated ? (
          <>
            <p className="ds-body text-ds-text-secondary">{t("review.report.sign_in")}</p>
            <button
              type="button"
              className="w-full h-ds-12 bg-ds-interactive rounded-ds-2xl ds-body-large text-ds-text-inverse"
              onClick={() => navigate(`/login?next=${encodeURIComponent(location.pathname + location.search)}`)}
            >
              {t("review.report.sign_in_cta")}
            </button>
          </>
        ) : (
          <>
            <fieldset className="flex flex-col gap-ds-2">
              <legend className="ds-label text-ds-text-primary mb-ds-2">{t("review.report.subtitle")}</legend>
              {REPORT_REASONS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  role="radio"
                  aria-checked={reason === r.value}
                  className={reason === r.value ? pillActive : pillInactive}
                  onClick={() => setReason(r.value)}
                >
                  {t(r.labelKey)}
                </button>
              ))}
            </fieldset>
            <label className="flex flex-col gap-ds-2">
              <span className="ds-label text-ds-text-primary">{t("review.report.note_label")}</span>
              <textarea
                value={note}
                maxLength={1000}
                rows={3}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("review.report.note_placeholder")}
                className="border border-ds-border rounded-ds-xl px-ds-4 py-ds-3 ds-body text-ds-text-primary bg-ds-bg-primary outline-none focus:border-ds-interactive resize-none"
              />
            </label>
            <button
              type="button"
              disabled={!reason || sending}
              onClick={submit}
              className="w-full h-ds-12 bg-ds-interactive rounded-ds-2xl ds-body-large text-ds-text-inverse disabled:opacity-50"
            >
              {t("review.report.submit")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
