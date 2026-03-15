import apiClient from "./client";
import { Invite } from "@/types";

export const invitesApi = {
  list: (providerId: number) =>
    apiClient.get<Invite[]>(`/invites/provider/${providerId}`).then((r) => r.data),

  create: (providerId: number, email: string) =>
    apiClient
      .post<Invite>(`/invites/provider/${providerId}`, { invited_email: email })
      .then((r) => r.data),

  validate: (token: string) =>
    apiClient
      .get<{ token: string; is_valid: boolean; provider_id?: number; invited_email?: string }>(
        `/invites/validate/${token}`
      )
      .then((r) => r.data),

  revoke: (inviteId: number, providerId: number) =>
    apiClient.delete(`/invites/${inviteId}/provider/${providerId}`),
};
