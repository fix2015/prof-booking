import apiClient from "./client";

export interface TelegramLinkStatus {
  linked: boolean;
  username: string | null;
  deeplink_url: string;
  bot_username: string;
}

export const telegramApi = {
  getLinkStatus: () =>
    apiClient.get<TelegramLinkStatus>("/telegram/link").then((r) => r.data),

  unlink: () =>
    apiClient.delete("/telegram/link").then((r) => r.data),
};
