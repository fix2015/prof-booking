import apiClient from "./client";
import { Invite } from "@/types";

export const invitesApi = {
  list: (salonId: number) =>
    apiClient.get<Invite[]>(`/invites/salon/${salonId}`).then((r) => r.data),

  create: (salonId: number, email: string) =>
    apiClient
      .post<Invite>(`/invites/salon/${salonId}`, { invited_email: email })
      .then((r) => r.data),

  validate: (token: string) =>
    apiClient
      .get<{ token: string; is_valid: boolean; salon_id?: number; invited_email?: string }>(
        `/invites/validate/${token}`
      )
      .then((r) => r.data),

  revoke: (inviteId: number, salonId: number) =>
    apiClient.delete(`/invites/${inviteId}/salon/${salonId}`),
};
