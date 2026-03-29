const STATUS_CLASSES: Record<string, string> = {
  confirmed:   "bg-[var(--ds-feedback-success-bg)] text-[var(--ds-feedback-success)]",
  pending:     "bg-[var(--ds-feedback-warning-bg)] text-[var(--ds-feedback-warning)]",
  cancelled:   "bg-[var(--ds-feedback-error-bg)]   text-[var(--ds-feedback-error)]",
  in_progress: "bg-[var(--ds-feedback-info-bg)]    text-[var(--ds-feedback-info)]",
  completed:   "bg-ds-bg-secondary text-ds-text-secondary",
  no_show:     "bg-ds-bg-secondary text-ds-text-muted",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_CLASSES[status] ?? STATUS_CLASSES.confirmed;
  return (
    <span className={`ds-caption px-ds-2 py-[2px] rounded-ds-full font-medium ${cls}`}>
      {status.replace("_", " ")}
    </span>
  );
}
