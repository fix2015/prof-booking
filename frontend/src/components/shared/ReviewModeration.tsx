import { useState, type ReactNode } from "react";
import { Flag } from "lucide-react";
import { t } from "@/i18n";
import type { Review } from "@/types";
import { ReportReviewSheet } from "./ReportReviewSheet";

type Moderation = {
  isHidden: (review: Review) => boolean;
  markReported: (review: Review) => void;
  blockAuthor: (review: Review) => void;
};

const linkBtn = "inline-flex items-center gap-ds-1 ds-caption text-ds-text-muted underline-offset-2 hover:underline";
const chip = "h-ds-8 px-ds-3 rounded-ds-full border border-ds-border ds-caption text-ds-text-primary";

/** "Report" (flag icon) button that opens the report bottom sheet. Usable on any review card. */
export function ReportReviewButton({ review, onReported, className }: {
  review: Review;
  onReported?: (review: Review) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className={className ?? linkBtn}
        aria-label={t("review.report.aria", { name: review.client_name })}
        onClick={() => setOpen(true)}
      >
        <Flag className="h-3.5 w-3.5" aria-hidden />
        {t("review.report.action")}
      </button>
      {open && <ReportReviewSheet review={review} onClose={() => setOpen(false)} onReported={onReported} />}
    </>
  );
}

/**
 * A review with "Report" and "Block" actions (App Store guideline 1.2). Reporting sends the review to moderation and
 * hides it for this viewer; blocking hides every review by the same author for this viewer.
 */
export function ReviewModeration({ review, moderation, children }: { review: Review; moderation: Moderation; children: ReactNode }) {
  const [blockOpen, setBlockOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  if (notice) {
    return <p className="px-ds-4 py-ds-3 border-b border-ds-border last:border-b-0 ds-caption text-ds-text-secondary">{notice}</p>;
  }
  if (moderation.isHidden(review)) return null;

  const block = () => {
    setNotice(t("reviews.blocked", { name: review.client_name }));
    moderation.blockAuthor(review);
  };

  return (
    <div className="relative">
      {children}
      <div className="px-ds-4 pb-ds-3 -mt-ds-2 flex gap-ds-3">
        <ReportReviewButton review={review} onReported={moderation.markReported} />
        {review.author_key && (
          <button type="button" className={linkBtn} onClick={() => setBlockOpen(!blockOpen)}>{t("reviews.block")}</button>
        )}
      </div>
      {blockOpen && (
        <div className="px-ds-4 pb-ds-3 flex flex-col gap-ds-2">
          <p className="ds-caption text-ds-text-secondary">{t("reviews.block_confirm", { name: review.client_name })}</p>
          <div className="flex gap-ds-2">
            <button type="button" className={`${chip} bg-ds-interactive text-ds-text-inverse border-transparent`} onClick={block}>{t("reviews.block_user")}</button>
            <button type="button" className={chip} onClick={() => setBlockOpen(false)}>{t("common.cancel")}</button>
          </div>
        </div>
      )}
    </div>
  );
}
