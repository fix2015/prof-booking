import apiClient from "./client";
import { AuthTokens, User } from "@/types";

export interface LoginPayload {
  email: string;
  password: string;
}

export interface OwnerRegisterPayload {
  email: string;
  phone: string;
  password: string;
  salon_name: string;
  salon_address: string;
  worker_payment_amount: number;
}

export interface MasterRegisterPayload {
  email: string;
  name: string;
  phone: string;
  password: string;
  social_links?: Record<string, string>;
  invite_token?: string;
  salon_ids?: number[];
}

export const authApi = {
  login: (data: LoginPayload) =>
    apiClient.post<AuthTokens>("/auth/login", data).then((r) => r.data),

  registerOwner: (data: OwnerRegisterPayload) =>
    apiClient.post<AuthTokens>("/auth/register/owner", data).then((r) => r.data),

  registerMaster: (data: MasterRegisterPayload) =>
    apiClient.post<AuthTokens>("/auth/register/master", data).then((r) => r.data),

  logout: () => apiClient.post("/auth/logout"),

  refreshToken: (refresh_token: string) =>
    apiClient.post<AuthTokens>("/auth/refresh", { refresh_token }).then((r) => r.data),

  getMe: () => apiClient.get<User>("/users/me").then((r) => r.data),
};
