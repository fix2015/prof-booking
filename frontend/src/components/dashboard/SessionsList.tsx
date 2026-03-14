import { Session } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTime, formatDate } from "@/utils/dates";
import { formatCurrency, statusColorMap, statusLabel } from "@/utils/formatters";
import { cn } from "@/utils/cn";

interface SessionsListProps {
  sessions: Session[];
  title?: string;
  showDate?: boolean;
}

export function SessionsList({ sessions, title = "Sessions", showDate = false }: SessionsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {sessions.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">No sessions found</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded-lg border p-3 hover:bg-gray-50 transition-colors"
              >
                <div>
                  <p className="font-medium text-sm">{session.client_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {showDate
                      ? formatDate(session.starts_at, "MMM d 'at' h:mm a")
                      : formatTime(session.starts_at)}{" "}
                    — {formatTime(session.ends_at)}
                  </p>
                  {session.client_phone && (
                    <p className="text-xs text-muted-foreground">{session.client_phone}</p>
                  )}
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                      statusColorMap[session.status]
                    )}
                  >
                    {statusLabel[session.status]}
                  </span>
                  {session.price && (
                    <span className="text-xs font-medium">{formatCurrency(session.price)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
