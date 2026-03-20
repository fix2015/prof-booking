import { apiClient } from "./client";
import type { Invoice, EarningsSplit, InvoiceStatus } from "@/types";

export const invoicesApi = {
  salonInvoices: (salonId: number, professionalId?: number) =>
    apiClient.get<Invoice[]>(`/invoices/salon/${salonId}`, {
      params: professionalId ? { professional_id: professionalId } : {},
    }),

  myInvoices: () => apiClient.get<Invoice[]>("/invoices/me"),

  generate: (
    salonId: number,
    data: { professional_id: number; period_start: string; period_end: string; notes?: string }
  ) => apiClient.post<Invoice>(`/invoices/salon/${salonId}/generate`, data),

  updateStatus: (invoiceId: number, status: InvoiceStatus) =>
    apiClient.patch<Invoice>(`/invoices/${invoiceId}/status`, { status }),

  listSplits: (salonId: number) =>
    apiClient.get<EarningsSplit[]>(`/invoices/splits/salon/${salonId}`),

  createSplit: (
    salonId: number,
    data: { professional_id: number; professional_percentage: number; effective_from: string }
  ) => apiClient.post<EarningsSplit>(`/invoices/splits/salon/${salonId}`, data),
};
