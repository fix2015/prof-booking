import apiClient from "./client";
import type { BookingConfirmation, SessionStatus } from "@/types";

export interface PublicBookingPayload {
  provider_id: number;
  service_id: number;
  professional_id?: number;
  client_name: string;
  client_phone: string;
  client_email?: string;
  client_notes?: string;
  starts_at: string;
}

export interface BookingLookupResult {
  session_id: number;
  client_name: string;
  client_phone: string;
  provider_name: string;
  service_name?: string;
  professional_name?: string;
  starts_at: string;
  ends_at: string;
  price?: number;
  status: SessionStatus;
  cancellation_reason?: string;
  confirmation_code: string;
  created_at: string;
}

export const bookingApi = {
  create: (data: PublicBookingPayload) =>
    apiClient.post<BookingConfirmation>("/booking/", data).then((r) => r.data),

  lookupByPhone: (phone: string) =>
    apiClient.get<BookingLookupResult[]>("/booking/lookup", { params: { phone } }).then((r) => r.data),

  cancel: (sessionId: number, confirmationCode: string, phone: string, reason?: string) =>
    apiClient
      .post<BookingLookupResult>(`/booking/${sessionId}/cancel`, {
        confirmation_code: confirmationCode,
        phone,
        reason,
      })
      .then((r) => r.data),
};
