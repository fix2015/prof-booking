import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/api/client";
import { professionalsApi } from "@/api/masters";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { formatDateTime } from "@/utils/dates";
import { useAuthContext } from "@/context/AuthContext";
import { toast } from "@/hooks/useToast";
import { t } from "@/i18n";
import { Building2, Check, X } from "lucide-react";

interface Notification {
  id: number;
  notification_type: string;
  recipient: string;
  subject?: string;
  body?: string;
  status: string;
  sent_at?: string;
  created_at: string;
}

interface ProviderInvite {
  id: number;
  provider_id: number;
  professional_id: number;
  status: "pending" | "accepted" | "rejected";
  message?: string;
  created_at: string;
  provider?: { id: number; name: string };
}

export function NotificationsPage() {
  const { role } = useAuthContext();
  const qc = useQueryClient();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: () => apiClient.get<Notification[]>("/notifications/").then((r) => r.data),
  });

  const { data: invites = [], isLoading: invitesLoading } = useQuery({
    queryKey: ["my-invites"],
    queryFn: () => professionalsApi.getMyInvites() as Promise<ProviderInvite[]>,
    enabled: role === "professional",
  });

  const respondMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: "accepted" | "rejected" }) =>
      professionalsApi.respondToInvite(id, status),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["my-invites"] });
      toast({
        title: vars.status === "accepted" ? "Invite accepted!" : "Invite rejected",
        description: vars.status === "accepted"
          ? "You are now linked to this provider."
          : "The invite has been declined.",
      });
    },
    onError: () => toast({ title: "Failed to respond", variant: "destructive" }),
  });

  const pendingInvites = invites.filter((i) => i.status === "pending");
  const pastInvites = invites.filter((i) => i.status !== "pending");

  return (
    <div className="space-y-6">
      <h1 className="text-xl md:text-2xl font-bold">{t("notifications.title")}</h1>

      {/* Provider invites — professionals only */}
      {role === "professional" && (
        <div className="space-y-3">
          {invitesLoading ? (
            <Spinner className="mx-auto" />
          ) : pendingInvites.length > 0 ? (
            <>
              <h2 className="text-base font-semibold flex items-center gap-2">
                <Building2 className="h-4 w-4 text-purple-600" />
                Provider Invites
                <span className="ml-1 inline-flex items-center justify-center h-5 w-5 rounded-full bg-purple-600 text-white text-[11px] font-bold">
                  {pendingInvites.length}
                </span>
              </h2>
              {pendingInvites.map((invite) => (
                <Card key={invite.id} className="border-purple-200 bg-purple-50/40">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-gray-900">
                          {invite.provider?.name ?? `Provider #${invite.provider_id}`}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Invited you to join their team · {formatDateTime(invite.created_at)}
                        </p>
                        {invite.message && (
                          <p className="text-sm text-gray-700 mt-1 italic">"{invite.message}"</p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          className="gap-1.5 bg-purple-700 hover:bg-purple-800"
                          disabled={respondMutation.isPending}
                          onClick={() => respondMutation.mutate({ id: invite.id, status: "accepted" })}
                        >
                          <Check className="h-3.5 w-3.5" /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-red-600 border-red-200 hover:bg-red-50"
                          disabled={respondMutation.isPending}
                          onClick={() => respondMutation.mutate({ id: invite.id, status: "rejected" })}
                        >
                          <X className="h-3.5 w-3.5" /> Reject
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : null}

          {/* Past invites */}
          {pastInvites.length > 0 && (
            <>
              <h2 className="text-sm font-medium text-muted-foreground mt-4">Past Invites</h2>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {pastInvites.map((invite) => (
                      <div key={invite.id} className="flex items-center justify-between gap-2 p-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">
                            {invite.provider?.name ?? `Provider #${invite.provider_id}`}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDateTime(invite.created_at)}</p>
                        </div>
                        <Badge variant={invite.status === "accepted" ? "success" : "destructive"}>
                          {invite.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      )}

      {/* Regular session notifications */}
      <div>
        {pendingInvites.length > 0 && role === "professional" && (
          <h2 className="text-base font-semibold mb-3">Session Notifications</h2>
        )}
        {isLoading ? (
          <Spinner className="mx-auto" />
        ) : (
          <Card>
            <CardContent className="p-0">
              {notifications.length === 0 ? (
                <p className="py-12 text-center text-muted-foreground">{t("notifications.empty")}</p>
              ) : (
                <div className="divide-y">
                  {notifications.map((n) => (
                    <div key={n.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 md:p-4">
                      <div className="min-w-0">
                        <p className="text-sm font-medium">{n.subject || n.notification_type.replace(/_/g, " ")}</p>
                        {n.body && <p className="text-sm text-gray-700 mt-0.5">{n.body}</p>}
                        <p className="text-xs text-muted-foreground mt-0.5">{n.recipient}</p>
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
    </div>
  );
}
