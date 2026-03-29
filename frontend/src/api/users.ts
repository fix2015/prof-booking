import apiClient from "./client";
import type { User } from "@/types";

export interface UserUpdatePayload {
  email?: string;
  phone?: string;
  name?: string;
  avatar_url?: string;
}

export const usersApi = {
  updateMe: (data: UserUpdatePayload) =>
    apiClient.patch<User>("/users/me", data).then((r) => r.data),
};
