import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import apiClient from "@/api/client";
import { professionalsApi } from "@/api/masters";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { AppHeader } from "@/components/mobile/AppHeader";
import { NotificationItem } from "@/components/shared/NotificationItem";
import { formatDateTime } from "@/utils/dates";
import { useAuthContext } from "@/context/AuthContext";
import { toast } from "@/hooks/useToast";
import { t } from "@/i18n";
import { Building2, Check, X, MessageCircle, Unlink } from "lucide-react";
import { telegramApi } from "@/api/telegram";

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
  const navigate = useNavigate();
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

  if (role === "client") {
    return (
      <div className="max-w-[768px] mx-auto min-h-screen flex flex-col bg-ds-bg-secondary -m-3 md:-m-5 lg:-m-6">
        <AppHeader variant="back-title" title={t("notifications.title")} onBack={() => navigate(-1)} />
        <div className="flex-1 overflow-auto p-ds-4">
          {isLoading ? (
            <Spinner className="mx-auto mt-8" />
          ) : notifications.length === 0 ? (
            <p className="py-ds-12 text-center ds-body text-ds-text-secondary">{t("notifications.empty")}</p>
          ) : (
            <div className="flex flex-col gap-ds-2">
              {notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} variant="card" />
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-ds-6">
      <h1 className="ds-h2">{t("notifications.title")}</h1>

      {/* Telegram link section */}
      <TelegramLinkSection />

      {/* Provider invites — professionals only */}
      {role === "professional" && (
        <div className="space-y-ds-3">
          {invitesLoading ? (
            <Spinner className="mx-auto" />
          ) : pendingInvites.length > 0 ? (
            <>
              <h2 className="ds-body-strong flex items-center gap-ds-2">
                <Building2 className="h-4 w-4 text-ds-interactive" />
                Provider Invites
                <span className="ml-[4px] inline-flex items-center justify-center h-5 w-5 rounded-ds-full bg-ds-interactive text-ds-text-inverse ds-caption font-bold">
                  {pendingInvites.length}
                </span>
              </h2>
              {pendingInvites.map((invite) => (
                <Card key={invite.id} className="border-ds-border bg-ds-bg-secondary">
                  <CardContent className="p-ds-4">
                    <div className="flex items-start justify-between gap-ds-3 flex-wrap">
                      <div className="min-w-0">
                        <p className="ds-body-strong text-ds-text-primary">
                          {invite.provider?.name ?? `Provider #${invite.provider_id}`}
                        </p>
                        <p className="ds-caption text-ds-text-muted mt-[2px]">
                          Invited you to join their team · {formatDateTime(invite.created_at)}
                        </p>
                        {invite.message && (
                          <p className="ds-body text-ds-text-secondary mt-[4px] italic">"{invite.message}"</p>
                        )}
                      </div>
                      <div className="flex gap-ds-2 shrink-0">
                        <Button
                          size="sm"
                          className="gap-[6px] bg-ds-interactive hover:bg-ds-interactive-hover"
                          disabled={respondMutation.isPending}
                          onClick={() => respondMutation.mutate({ id: invite.id, status: "accepted" })}
                        >
                          <Check className="h-3.5 w-3.5" /> Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-[6px] text-[var(--ds-feedback-error)] border-[var(--ds-feedback-error)] hover:bg-[var(--ds-feedback-error-bg)]"
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
              <h2 className="ds-body text-ds-text-muted mt-ds-4">Past Invites</h2>
              <Card>
                <CardContent className="p-0">
                  <div className="divide-y divide-ds-border">
                    {pastInvites.map((invite) => (
                      <div key={invite.id} className="flex items-center justify-between gap-ds-2 p-ds-3">
                        <div className="min-w-0">
                          <p className="ds-body-strong text-ds-text-primary truncate">
                            {invite.provider?.name ?? `Provider #${invite.provider_id}`}
                          </p>
                          <p className="ds-caption text-ds-text-muted">{formatDateTime(invite.created_at)}</p>
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
          <h2 className="ds-body-strong mb-ds-3">Session Notifications</h2>
        )}
        {isLoading ? (
          <Spinner className="mx-auto" />
        ) : (
          <Card>
            <CardContent className="p-0">
              {notifications.length === 0 ? (
                <p className="py-ds-12 text-center text-ds-text-secondary ds-body">{t("notifications.empty")}</p>
              ) : (
                <div className="divide-y divide-ds-border">
                  {notifications.map((n) => (
                    <NotificationItem key={n.id} notification={n} variant="row" />
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


/** Telegram link/unlink card shown on the notifications page. */
function TelegramLinkSection() {
  const qc = useQueryClient();

  const { data: linkStatus, isLoading } = useQuery({
    queryKey: ["telegram-link"],
    queryFn: telegramApi.getLinkStatus,
  });

  const unlinkMutation = useMutation({
    mutationFn: telegramApi.unlink,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["telegram-link"] });
      toast({ title: "Telegram unlinked" });
    },
    onError: () => toast({ title: "Failed to unlink", variant: "destructive" }),
  });

  if (isLoading || !linkStatus) return null;

  return (
    <Card className="border-ds-border">
      <CardContent className="p-ds-4">
        <div className="flex items-center gap-ds-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-ds-full bg-[#229ED9]/10">
            <MessageCircle className="h-5 w-5 text-[#229ED9]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="ds-body-strong text-ds-text-primary">Telegram Notifications</p>
            {linkStatus.linked ? (
              <p className="ds-caption text-ds-text-secondary">
                Linked{linkStatus.username ? ` as @${linkStatus.username}` : ""}
              </p>
            ) : (
              <p className="ds-caption text-ds-text-muted">
                Get instant notifications via Telegram
              </p>
            )}
          </div>
          {linkStatus.linked ? (
            <Button
              size="sm"
              variant="outline"
              className="gap-[6px] text-destructive"
              onClick={() => unlinkMutation.mutate()}
              disabled={unlinkMutation.isPending}
            >
              <Unlink className="h-3.5 w-3.5" />
              Unlink
            </Button>
          ) : (
            <Button
              size="sm"
              className="gap-[6px] bg-[#229ED9] hover:bg-[#1a8bc2]"
              asChild
            >
              <a href={linkStatus.deeplink_url} target="_blank" rel="noopener noreferrer">
                <MessageCircle className="h-3.5 w-3.5" />
                Authorize
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
