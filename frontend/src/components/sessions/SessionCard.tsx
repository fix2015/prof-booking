import { Session } from "@/types";
import { formatDateTime } from "@/utils/dates";
import { formatCurrency, statusColorMap, statusLabel } from "@/utils/formatters";
import { cn } from "@/utils/cn";
import { Button } from "@/components/ui/button";

interface SessionCardProps {
  session: Session;
  showCancel?: boolean;
  showConfirm?: boolean;
  showComplete?: boolean;
  onCancel?: (session: Session) => void;
  onConfirm?: (session: Session) => void;
  onComplete?: (session: Session) => void;
}

export function SessionCard({
  session,
  showCancel,
  showConfirm,
  showComplete,
  onCancel,
  onConfirm,
  onComplete,
}: SessionCardProps) {
  const canCancel = showCancel && (session.status === "pending" || session.status === "confirmed");
  const canConfirm = showConfirm && session.status === "pending";
  const canComplete = showComplete && session.status === "confirmed";
  const hasActions = canCancel || canConfirm || canComplete;

  return (
    <div className="rounded-[10px] border border-ds-border bg-ds-bg-primary p-ds-3 md:p-ds-4 shadow-sm space-y-ds-2">
      {/* Client name */}
      <p className="ds-body-strong text-ds-text-primary">{session.client_name}</p>

      {/* Phone — clickable */}
      <a
        href={`tel:${session.client_phone}`}
        className="ds-body-small text-ds-interactive underline hover:opacity-80 block"
      >
        {session.client_phone}
      </a>

      {/* Date */}
      <p className="ds-body-small text-ds-text-secondary">
        {session.starts_at ? formatDateTime(session.starts_at) : "—"}
      </p>

      {/* Price */}
      {session.price != null && (
        <p className="ds-body-strong text-ds-text-primary">
          {formatCurrency(session.price)}
        </p>
      )}

      {/* Status badge + actions row */}
      <div className="flex items-center gap-ds-2">
        <span
          className={cn(
            "inline-flex items-center rounded-ds-full px-ds-2 py-[2px] ds-badge",
            statusColorMap[session.status]
          )}
        >
          {statusLabel[session.status]}
        </span>

        {hasActions && (
          <>
            <span className="flex-1" />
            <div className="flex gap-ds-2">
              {canConfirm && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onConfirm?.(session)}
                >
                  Confirm
                </Button>
              )}
              {canComplete && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onComplete?.(session)}
                >
                  Complete
                </Button>
              )}
              {canCancel && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onCancel?.(session)}
                >
                  Cancel
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
