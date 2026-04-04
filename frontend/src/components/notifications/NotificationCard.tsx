import { cn } from "@/utils/cn";
import { formatDateTime } from "@/utils/dates";

type NotificationStatus = "sent" | "pending" | "failed";

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

interface NotificationCardProps {
  notification: NotificationData;
}

const statusStyles: Record<string, { bg: string; text: string }> = {
  sent: { bg: "bg-green-100", text: "text-green-800" },
  pending: { bg: "bg-yellow-100", text: "text-yellow-800" },
  failed: { bg: "bg-red-100", text: "text-red-800" },
};

/** Extract phone numbers from text */
function extractPhone(text: string): string | null {
  const match = text.match(/(\+?[\d\s\-().]{7,20})/);
  return match ? match[1].trim() : null;
}

/** Extract provider/studio name patterns */
function extractProvider(text: string): string | null {
  const match = text.match(/at ([A-Z][a-zA-Z\s&']+(?:Studio|Salon|Pro|Beauty|Zone|Spa|Nails))/);
  return match ? match[1].trim() : null;
}

export function NotificationCard({ notification: n }: NotificationCardProps) {
  const title = n.subject || n.notification_type.replace(/_/g, " ");
  const timestamp = formatDateTime(n.sent_at || n.created_at);
  const status = (n.status as NotificationStatus) || "pending";
  const style = statusStyles[status] || statusStyles.pending;

  const phone = n.recipient || (n.body ? extractPhone(n.body) : null);
  const provider = n.body ? extractProvider(n.body) : null;

  return (
    <div className="rounded-[10px] border border-ds-border bg-ds-bg-primary p-ds-3 md:p-ds-4 shadow-sm space-y-ds-2">
      {/* Title + badge */}
      <div className="flex items-center gap-ds-2">
        <p className="ds-body-strong text-ds-text-primary flex-1 min-w-0 truncate capitalize">
          {title}
        </p>
        <span
          className={cn(
            "inline-flex items-center rounded-ds-full px-ds-2 py-[2px] text-[11px] font-medium shrink-0",
            style.bg,
            style.text
          )}
        >
          {status}
        </span>
      </div>

      {/* Provider name */}
      {provider && (
        <p className="ds-body-small text-ds-text-primary">{provider}</p>
      )}

      {/* Phone — clickable */}
      {phone && (
        <a
          href={`tel:${phone}`}
          className="ds-body-small text-ds-interactive underline hover:opacity-80 block"
        >
          {phone}
        </a>
      )}

      {/* Body text */}
      {n.body && (
        <p className="ds-body-small text-ds-text-secondary">{n.body}</p>
      )}

      {/* Timestamp */}
      <p className="ds-caption text-ds-text-muted">{timestamp}</p>
    </div>
  );
}
