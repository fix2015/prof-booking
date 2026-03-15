import apiClient from "./client";
import { BookingConfirmation } from "@/types";

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

export const bookingApi = {
  create: (data: PublicBookingPayload) =>
    apiClient.post<BookingConfirmation>("/booking/", data).then((r) => r.data),
};
