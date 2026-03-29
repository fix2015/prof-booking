import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/utils/dates";

interface NotificationData {
  id: number;
  notification_type: string;
  recipient?: string;
  subject?: string;
  body?: string;
  status: string;
  sent_at?: string;
  created_at: string;
}

interface NotificationItemProps {
  notification: NotificationData;
  /** "card" = mobile consumer view; "row" = B2B dashboard list row */
  variant?: "card" | "row";
}

/** Pure presentational component for a single notification entry. */
export function NotificationItem({ notification: n, variant = "card" }: NotificationItemProps) {
  const title = n.subject || n.notification_type.replace(/_/g, " ");
  const timestamp = formatDateTime(n.sent_at || n.created_at);

  if (variant === "card") {
    return (
      <div className="bg-ds-bg-primary rounded-ds-xl border border-ds-border p-ds-3 flex flex-col gap-[4px]">
        <p className="ds-body-strong text-ds-text-primary">{title}</p>
        {n.body && <p className="ds-body text-ds-text-secondary">{n.body}</p>}
        <p className="ds-caption text-ds-text-muted">{timestamp}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-ds-2 p-ds-3 md:p-ds-4">
      <div className="min-w-0">
        <p className="ds-body-strong text-ds-text-primary">{title}</p>
        {n.body && <p className="ds-body text-ds-text-secondary mt-[2px]">{n.body}</p>}
        {n.recipient && <p className="ds-caption text-ds-text-muted mt-[2px]">{n.recipient}</p>}
      </div>
      <div className="flex sm:flex-col items-center sm:items-end gap-ds-2 sm:gap-[4px] shrink-0">
        <Badge variant={n.status === "sent" ? "success" : n.status === "failed" ? "destructive" : "secondary"}>
          {n.status}
        </Badge>
        <span className="ds-caption text-ds-text-muted whitespace-nowrap">{timestamp}</span>
      </div>
    </div>
  );
}
