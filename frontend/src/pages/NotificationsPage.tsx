import { useQuery } from "@tanstack/react-query";
import apiClient from "@/api/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { formatDateTime } from "@/utils/dates";

interface Notification {
  id: number;
  notification_type: string;
  recipient: string;
  subject?: string;
  status: string;
  sent_at?: string;
  created_at: string;
}

export function NotificationsPage() {
  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiClient.get<Notification[]>("/notifications/").then((r) => r.data),
  });

  return (
    <div className="space-y-4 md:space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">Notifications</h1>

      {isLoading ? (
        <Spinner className="mx-auto" />
      ) : (
        <Card>
          <CardContent className="p-0">
            {notifications.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground">No notifications yet</p>
            ) : (
              <div className="divide-y">
                {notifications.map((n) => (
                  <div key={n.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 md:p-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{n.notification_type.replace(/_/g, " ")}</p>
                      <p className="text-xs text-muted-foreground truncate">{n.recipient}</p>
                      {n.subject && <p className="text-xs text-muted-foreground truncate">{n.subject}</p>}
                    </div>
                    <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1 shrink-0">
                      <Badge variant={n.status === "sent" ? "success" : n.status === "failed" ? "destructive" : "secondary"}>
                        {n.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(n.sent_at || n.created_at)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
