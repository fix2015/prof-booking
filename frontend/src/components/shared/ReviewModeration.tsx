import { useState, type ReactNode } from "react";
import { reviewsApi, type ReviewReportReason } from "@/api/reviews";
import { t } from "@/i18n";
import type { Review } from "@/types";

type Moderation = {
  isHidden: (review: Review) => boolean;
  markReported: (review: Review) => void;
  blockAuthor: (review: Review) => void;
};

const REASONS: { value: ReviewReportReason; key: Parameters<typeof t>[0] }[] = [
  { value: "spam", key: "reviews.report_spam" },
  { value: "offensive", key: "reviews.report_offensive" },
  { value: "fake", key: "reviews.report_fake" },
  { value: "other", key: "reviews.report_other" },
];

const linkBtn = "ds-caption text-ds-text-muted underline underline-offset-2";
const chip = "h-[32px] px-ds-3 rounded-ds-full border border-ds-border ds-caption text-ds-text-primary";

/**
 * A review with "Report" and "Block" actions (App Store guideline 1.2). Reporting sends the review to moderation and
 * hides it for this viewer; blocking hides every review by the same author for this viewer.
 */
export function ReviewModeration({ review, moderation, children }: { review: Review; moderation: Moderation; children: ReactNode }) {
  const [panel, setPanel] = useState<"none" | "report" | "block">("none");
  const [notice, setNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(false);

  if (notice) {
    return <p className="px-ds-4 py-ds-3 border-b border-ds-border last:border-b-0 ds-caption text-ds-text-secondary">{notice}</p>;
  }
  if (moderation.isHidden(review)) return null;

  const report = async (reason: ReviewReportReason) => {
    setSending(true);
    setError(false);
    try {
      await reviewsApi.report(review.id, reason);
      setNotice(t("reviews.reported"));
      moderation.markReported(review);
    } catch {
      setError(true);
    } finally {
      setSending(false);
    }
  };

  const block = () => {
    setNotice(t("reviews.blocked", { name: review.client_name }));
    moderation.blockAuthor(review);
  };

  return (
    <div className="relative">
      {children}
      <div className="px-ds-4 pb-ds-3 -mt-ds-2 flex gap-ds-3">
        <button className={linkBtn} onClick={() => setPanel(panel === "report" ? "none" : "report")}>{t("reviews.report")}</button>
        {review.author_key && (
          <button className={linkBtn} onClick={() => setPanel(panel === "block" ? "none" : "block")}>{t("reviews.block")}</button>
        )}
      </div>
      {panel === "report" && (
        <div className="px-ds-4 pb-ds-3 flex flex-col gap-ds-2">
          <p className="ds-caption text-ds-text-secondary">{t("reviews.report_title")}</p>
          <div className="flex flex-wrap gap-ds-2">
            {REASONS.map((r) => (
              <button key={r.value} className={chip} disabled={sending} onClick={() => report(r.value)}>{t(r.key)}</button>
            ))}
          </div>
          {error && <p className="ds-caption text-ds-feedback-error">{t("reviews.report_failed")}</p>}
        </div>
      )}
      {panel === "block" && (
        <div className="px-ds-4 pb-ds-3 flex flex-col gap-ds-2">
          <p className="ds-caption text-ds-text-secondary">{t("reviews.block_confirm", { name: review.client_name })}</p>
          <div className="flex gap-ds-2">
            <button className={`${chip} bg-ds-interactive text-ds-text-inverse border-transparent`} onClick={block}>{t("reviews.block_user")}</button>
            <button className={chip} onClick={() => setPanel("none")}>{t("common.cancel")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
